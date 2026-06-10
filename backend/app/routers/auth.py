from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr, Field

from ..config import settings
from ..dao.user_dao import UserDAO
from ..db import get_database
from ..models.enums import UserRole
from ..models.user import UserCreate, UserPublic, user_to_public
from ..services.auth_service import (
    AuthPermissionError,
    AuthTokenError,
    StaffPrincipal,
    create_auth_token,
    decode_auth_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str = Field(min_length=1)
    password: str = Field(min_length=1)


class LoginResponse(BaseModel):
    token: str
    user: UserPublic


class StaffUserCreateRequest(BaseModel):
    username: str = Field(min_length=1)
    password: str = Field(min_length=8)
    role: UserRole = UserRole.staff
    name: str = Field(min_length=1)
    email: EmailStr


def get_user_dao(database=Depends(get_database)) -> UserDAO:
    return UserDAO(database)


def set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.auth_cookie_name,
        value=token,
        max_age=settings.auth_token_minutes * 60,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
    )


def clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.auth_cookie_name,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
    )


def _bearer_or_cookie_token(request: Request) -> str | None:
    header = request.headers.get("Authorization")
    if header and header.lower().startswith("bearer "):
        return header[7:].strip()
    return request.cookies.get(settings.auth_cookie_name)


def require_staff(request: Request) -> StaffPrincipal:
    token = _bearer_or_cookie_token(request)

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Staff login required",
        )

    try:
        return decode_auth_token(token)
    except AuthTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc
    except AuthPermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc


def require_admin(principal: StaffPrincipal = Depends(require_staff)) -> StaffPrincipal:
    if principal.role != UserRole.admin.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    return principal


@router.post("/login", response_model=LoginResponse)
async def login(
    payload: LoginRequest,
    response: Response,
    user_dao: UserDAO = Depends(get_user_dao),
):
    user = await user_dao.get_by_username(payload.username)

    if user is None or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    token = create_auth_token(user["username"], user["role"])
    set_auth_cookie(response, token)

    return LoginResponse(token=token, user=user_to_public(user))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response):
    clear_auth_cookie(response)


@router.get("/me", response_model=UserPublic)
async def me(
    principal: StaffPrincipal = Depends(require_staff),
    user_dao: UserDAO = Depends(get_user_dao),
):
    user = await user_dao.get_by_username(principal.username)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists",
        )

    return user_to_public(user)


@router.get("/users", response_model=list[UserPublic])
async def list_staff_users(
    user_dao: UserDAO = Depends(get_user_dao),
    _admin: StaffPrincipal = Depends(require_admin),
):
    docs = await user_dao.list_all()
    return [user_to_public(doc) for doc in docs]


@router.post("/users", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
async def create_staff_user(
    payload: StaffUserCreateRequest,
    user_dao: UserDAO = Depends(get_user_dao),
    _admin: StaffPrincipal = Depends(require_admin),
):
    existing = await user_dao.get_by_username(payload.username)

    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken",
        )

    doc = await user_dao.create(
        UserCreate(
            username=payload.username,
            password_hash=hash_password(payload.password),
            role=payload.role,
            name=payload.name,
            email=payload.email,
        )
    )

    return user_to_public(doc)
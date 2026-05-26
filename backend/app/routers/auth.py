from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, Field

from ..config import settings
from ..dao.user_dao import UserDAO
from ..db import get_database
from ..models.user import UserPublic, user_to_public
from ..services.auth_service import (
    AuthPermissionError,
    AuthTokenError,
    StaffPrincipal,
    create_auth_token,
    decode_auth_token,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str = Field(min_length=1)
    password: str = Field(min_length=1)


class CurrentStaff(BaseModel):
    username: str
    role: str


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


def require_staff(request: Request) -> StaffPrincipal:
    token = request.cookies.get(settings.auth_cookie_name)
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


@router.post("/login", response_model=UserPublic)
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
    return user_to_public(user)


@router.post("/logout")
async def logout(response: Response):
    clear_auth_cookie(response)
    return {"status": "logged_out"}


@router.get("/me", response_model=CurrentStaff)
async def me(principal: StaffPrincipal = Depends(require_staff)):
    return {"username": principal.username, "role": principal.role}

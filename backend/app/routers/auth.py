from fastapi import APIRouter, Depends, HTTPException, Response, status

from ..config import settings
from ..dao.user_dao import UserDAO
from ..db import get_database
from ..models.user import LoginRequest, UserPublic, user_to_public
from ..security import create_access_token, require_staff
from ..services.user_service import UserService

router = APIRouter(prefix="/auth", tags=["auth"])


def get_user_service(database=Depends(get_database)) -> UserService:
    return UserService(UserDAO(database))


@router.post("/login", response_model=UserPublic)
async def login(
    payload: LoginRequest,
    response: Response,
    service: UserService = Depends(get_user_service),
):
    user = await service.authenticate(payload.username, payload.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    token = create_access_token(user["username"], user["role"])
    response.set_cookie(
        key=settings.auth_cookie_name,
        value=token,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite="lax",
        max_age=settings.jwt_expire_minutes * 60,
    )
    return user_to_public(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response):
    response.delete_cookie(key=settings.auth_cookie_name)


@router.get("/me", response_model=UserPublic)
async def me(user: dict = Depends(require_staff)):
    return user_to_public(user)

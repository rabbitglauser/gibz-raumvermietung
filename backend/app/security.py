"""Password hashing, JWT issuance, and staff auth dependencies.

Customers never get a JWT — they use per-reservation edit tokens (see
``ReservationDAO``). Only staff log in here. ``require_staff`` gates any
authenticated route; ``require_role`` narrows access to specific roles
(e.g. admin-only deletion / "higher authority override").
"""

from datetime import datetime, timedelta, timezone
from typing import Iterable

import bcrypt
import jwt
from fastapi import Depends, HTTPException, Request, status

from .config import settings
from .dao.user_dao import UserDAO
from .db import get_database
from .models.enums import UserRole


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def create_access_token(username: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": username,
        "role": role,
        "iat": now,
        "exp": now + timedelta(minutes=settings.jwt_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])


async def get_current_user(
    request: Request,
    database=Depends(get_database),
) -> dict:
    token = request.cookies.get(settings.auth_cookie_name)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    try:
        payload = decode_access_token(token)
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
        )

    username = payload.get("sub")
    user = await UserDAO(database).get_by_username(username) if username else None
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unknown user",
        )
    return user


async def require_staff(user: dict = Depends(get_current_user)) -> dict:
    """Any authenticated staff member may view and manage reservations."""
    return user


def require_role(*roles: UserRole):
    """Dependency factory that restricts a route to specific roles."""
    allowed = {role.value for role in roles}

    async def checker(user: dict = Depends(get_current_user)) -> dict:
        if user.get("role") not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user

    return checker

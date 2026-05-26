from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from jwt import InvalidTokenError

from ..config import settings
from ..models.enums import UserRole
from ..models.user import UserCreate

ALGORITHM = "HS256"


class AuthTokenError(Exception):
    """Raised when an auth token is missing, invalid, or expired."""


class AuthPermissionError(Exception):
    """Raised when a valid auth token does not grant staff access."""


@dataclass(frozen=True)
class StaffPrincipal:
    username: str
    role: str


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def create_auth_token(username: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": username,
        "role": role,
        "iat": now,
        "exp": now + timedelta(minutes=settings.auth_token_minutes),
    }
    return jwt.encode(payload, settings.auth_secret_key, algorithm=ALGORITHM)


def decode_auth_token(token: str) -> StaffPrincipal:
    try:
        payload = jwt.decode(token, settings.auth_secret_key, algorithms=[ALGORITHM])
    except InvalidTokenError as exc:
        raise AuthTokenError("Invalid or expired staff session") from exc

    username = payload.get("sub")
    role = payload.get("role")
    if not isinstance(username, str) or not isinstance(role, str):
        raise AuthTokenError("Invalid staff session")

    if role not in {UserRole.staff.value, UserRole.admin.value}:
        raise AuthPermissionError("Staff access required")

    return StaffPrincipal(username=username, role=role)


async def seed_demo_staff_user(database) -> bool:
    """Create the local demo staff user when explicitly enabled."""
    if not settings.seed_staff_enabled:
        return False

    from ..dao.user_dao import UserDAO

    dao = UserDAO(database)
    existing = await dao.get_by_username(settings.seed_staff_username)
    if existing is not None:
        return False

    await dao.create(
        UserCreate(
            username=settings.seed_staff_username,
            password_hash=hash_password(settings.seed_staff_password),
            role=UserRole.staff,
            name=settings.seed_staff_name,
            email=settings.seed_staff_email,
        )
    )
    return True

from typing import Optional

from ..dao.user_dao import UserDAO
from ..models.enums import UserRole
from ..models.user import UserCreate
from ..security import hash_password, verify_password


class UserService:
    """Staff account logic: authentication and seeding."""

    def __init__(self, dao: UserDAO) -> None:
        self.dao = dao

    async def authenticate(self, username: str, password: str) -> Optional[dict]:
        user = await self.dao.get_by_username(username)
        if user is None:
            return None
        if not verify_password(password, user.get("password_hash", "")):
            return None
        return user

    async def create_staff(
        self,
        username: str,
        password: str,
        name: str,
        email: str,
        role: UserRole = UserRole.staff,
    ) -> dict:
        user = UserCreate(
            username=username,
            password_hash=hash_password(password),
            name=name,
            email=email,
            role=role,
        )
        return await self.dao.create(user)

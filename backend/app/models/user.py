from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from .enums import UserRole


class UserCreate(BaseModel):
    username: str = Field(min_length=1)
    password_hash: str = Field(min_length=1)
    role: UserRole = UserRole.staff
    name: str = Field(min_length=1)
    email: EmailStr


class User(UserCreate):
    id: str
    created_at: datetime


class UserPublic(BaseModel):
    id: str
    username: str
    role: UserRole
    name: str
    email: EmailStr
    created_at: Optional[datetime] = None


class LoginRequest(BaseModel):
    username: str = Field(min_length=1)
    password: str = Field(min_length=1)


def user_to_public(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "username": doc["username"],
        "role": doc["role"],
        "name": doc["name"],
        "email": doc["email"],
        "created_at": doc.get("created_at"),
    }

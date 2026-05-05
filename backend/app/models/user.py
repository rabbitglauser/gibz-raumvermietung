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

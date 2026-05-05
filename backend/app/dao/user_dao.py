from datetime import datetime, timezone
from typing import Optional

from ..models.user import UserCreate


class UserDAO:
    """Mongo data access for the `users` (staff) collection."""

    def __init__(self, database) -> None:
        self.collection = database.users

    async def create(self, user: UserCreate) -> dict:
        doc = user.model_dump(mode="json")
        doc["created_at"] = datetime.now(timezone.utc)
        result = await self.collection.insert_one(doc)
        return await self.collection.find_one({"_id": result.inserted_id})

    async def get_by_username(self, username: str) -> Optional[dict]:
        return await self.collection.find_one({"username": username})

    async def list_all(self) -> list[dict]:
        items: list[dict] = []
        cursor = self.collection.find().sort("username", 1)
        async for item in cursor:
            items.append(item)
        return items

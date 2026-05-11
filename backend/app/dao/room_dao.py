from typing import Optional

from ..models.room import Room


class RoomDAO:
    """Mongo data access for the `rooms` collection."""

    def __init__(self, database) -> None:
        self.collection = database.rooms

    async def create(self, room: Room) -> dict:
        doc = room.model_dump(mode="json")
        await self.collection.insert_one(doc)
        return doc

    async def get_by_room_id(self, room_id: str) -> Optional[dict]:
        return await self.collection.find_one({"room_id": room_id})

    async def list_all(self) -> list[dict]:
        items: list[dict] = []
        cursor = self.collection.find().sort("sort_order", 1)
        async for item in cursor:
            items.append(item)
        return items

    async def update(self, room_id: str, data: dict) -> Optional[dict]:
        await self.collection.update_one({"room_id": room_id}, {"$set": data})
        return await self.get_by_room_id(room_id)

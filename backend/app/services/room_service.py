from typing import Optional

from ..dao.room_dao import RoomDAO
from ..models.room import Room, room_to_response


class RoomService:
    def __init__(self, dao: RoomDAO) -> None:
        self.dao = dao

    async def list_all(self) -> list[dict]:
        docs = await self.dao.list_all()
        return [room_to_response(doc) for doc in docs]

    async def get_by_room_id(self, room_id: str) -> Optional[dict]:
        doc = await self.dao.get_by_room_id(room_id)
        return room_to_response(doc) if doc else None

    async def create(self, room: Room) -> dict:
        doc = await self.dao.create(room)
        return room_to_response(doc)

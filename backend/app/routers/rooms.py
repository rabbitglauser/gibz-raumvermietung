from fastapi import APIRouter, Depends, HTTPException, status

from ..dao.room_dao import RoomDAO
from ..db import get_database
from ..models.room import Room, RoomList
from ..services.room_service import RoomService

router = APIRouter(prefix="/rooms", tags=["rooms"])


def get_room_service(database=Depends(get_database)) -> RoomService:
    return RoomService(RoomDAO(database))


@router.get("", response_model=RoomList)
async def list_rooms(service: RoomService = Depends(get_room_service)):
    items = await service.list_all()
    return {"items": items}


@router.get("/{room_id}", response_model=Room)
async def get_room(
    room_id: str,
    service: RoomService = Depends(get_room_service),
):
    room = await service.get_by_room_id(room_id)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    return room

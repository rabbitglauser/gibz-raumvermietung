from pydantic import BaseModel, Field

from .enums import EquipmentType, RoomId, SeatingType


class Room(BaseModel):
    room_id: RoomId
    capacity: int = Field(gt=0)
    seating_types: list[SeatingType]
    equipment: list[EquipmentType]
    microphone: bool = False
    technical_support: bool = False


class RoomList(BaseModel):
    items: list[Room]


def room_to_response(doc: dict) -> dict:
    return {
        "room_id": doc["room_id"],
        "capacity": doc["capacity"],
        "seating_types": doc.get("seating_types", []),
        "equipment": doc.get("equipment", []),
        "microphone": doc.get("microphone", False),
        "technical_support": doc.get("technical_support", False),
    }

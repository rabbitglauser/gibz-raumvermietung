from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field

from ..db import db

router = APIRouter(prefix="/reservations", tags=["reservations"])


class ReservationCreate(BaseModel):
    room_id: str = Field(min_length=1)
    contact_name: str = Field(min_length=1)
    contact_email: EmailStr
    date: str
    start_time: str
    end_time: str
    notes: Optional[str] = None


class ReservationOut(BaseModel):
    id: str
    room_id: str
    contact_name: str
    contact_email: EmailStr
    date: str
    start_time: str
    end_time: str
    notes: Optional[str] = None
    created_at: datetime


@router.post("", response_model=ReservationOut)
async def create_reservation(payload: ReservationCreate):
    doc = payload.model_dump()
    doc["created_at"] = datetime.utcnow()

    result = await db.reservations.insert_one(doc)
    created = await db.reservations.find_one({"_id": result.inserted_id})

    if not created:
        raise HTTPException(status_code=500, detail="Reservation was not created")

    return {
        "id": str(created["_id"]),
        "room_id": created["room_id"],
        "contact_name": created["contact_name"],
        "contact_email": created["contact_email"],
        "date": created["date"],
        "start_time": created["start_time"],
        "end_time": created["end_time"],
        "notes": created.get("notes"),
        "created_at": created["created_at"],
    }


@router.get("")
async def list_reservations():
    items = []
    cursor = db.reservations.find().sort("created_at", -1)

    async for item in cursor:
        item["id"] = str(item.pop("_id"))
        items.append(item)

    return items
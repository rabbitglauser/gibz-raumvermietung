from datetime import date, datetime, time, timezone
from enum import Enum
from typing import Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

from ..db import db

router = APIRouter(prefix="/reservations", tags=["reservations"])


class OrganizerType(str, Enum):
    internal = "internal"
    external = "external"


class ReservationCreate(BaseModel):
    event_name: str = Field(min_length=1)
    date: date
    setup_start_time: time
    start_time: time
    end_time: time
    room: str = Field(min_length=1)
    contact_name: str = Field(min_length=1)
    email: EmailStr
    phone: str = Field(min_length=1)
    attendee_count: int = Field(gt=0)
    billing_name: str = Field(min_length=1)
    billing_address: str = Field(min_length=1)
    billing_postal_code_city: str = Field(min_length=1)
    organizer_type: OrganizerType
    terms_accepted: bool
    department: Optional[str] = None
    invoice_note: Optional[str] = None
    catering_needed: Optional[bool] = None
    catering_time_slots: Optional[list[str]] = None
    seating_type: Optional[str] = None
    additional_equipment: Optional[list[str]] = None
    microphone_needed: Optional[bool] = None
    technical_support_regie_hours: Optional[float] = Field(default=None, ge=0)
    info_screen_text: Optional[str] = None
    remarks: Optional[str] = None
    publication_settings: Optional[list[str]] = None
    target_groups: Optional[list[str]] = None

    @field_validator("terms_accepted")
    @classmethod
    def validate_terms_accepted(cls, value: bool) -> bool:
        if not value:
            raise ValueError("terms_accepted must be true")
        return value

    @model_validator(mode="after")
    def validate_time_order(self) -> "ReservationCreate":
        if self.setup_start_time > self.start_time:
            raise ValueError("setup_start_time must be before or equal to start_time")
        if self.start_time >= self.end_time:
            raise ValueError("start_time must be before end_time")
        return self


class ReservationOut(BaseModel):
    id: str
    event_name: str
    date: date
    setup_start_time: time
    start_time: time
    end_time: time
    room: str
    contact_name: str
    email: EmailStr
    phone: str
    attendee_count: int
    billing_name: str
    billing_address: str
    billing_postal_code_city: str
    organizer_type: OrganizerType
    terms_accepted: bool
    status: str
    created_at: datetime
    updated_at: datetime
    department: Optional[str] = None
    invoice_note: Optional[str] = None
    catering_needed: Optional[bool] = None
    catering_time_slots: Optional[list[str]] = None
    seating_type: Optional[str] = None
    additional_equipment: Optional[list[str]] = None
    microphone_needed: Optional[bool] = None
    technical_support_regie_hours: Optional[float] = None
    info_screen_text: Optional[str] = None
    remarks: Optional[str] = None
    publication_settings: Optional[list[str]] = None
    target_groups: Optional[list[str]] = None


def reservation_to_response(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "event_name": doc["event_name"],
        "date": doc["date"],
        "setup_start_time": doc["setup_start_time"],
        "start_time": doc["start_time"],
        "end_time": doc["end_time"],
        "room": doc["room"],
        "contact_name": doc["contact_name"],
        "email": doc["email"],
        "phone": doc["phone"],
        "attendee_count": doc["attendee_count"],
        "billing_name": doc["billing_name"],
        "billing_address": doc["billing_address"],
        "billing_postal_code_city": doc["billing_postal_code_city"],
        "organizer_type": doc["organizer_type"],
        "terms_accepted": doc["terms_accepted"],
        "status": doc["status"],
        "created_at": doc["created_at"],
        "updated_at": doc["updated_at"],
        "department": doc.get("department"),
        "invoice_note": doc.get("invoice_note"),
        "catering_needed": doc.get("catering_needed"),
        "catering_time_slots": doc.get("catering_time_slots"),
        "seating_type": doc.get("seating_type"),
        "additional_equipment": doc.get("additional_equipment"),
        "microphone_needed": doc.get("microphone_needed"),
        "technical_support_regie_hours": doc.get("technical_support_regie_hours"),
        "info_screen_text": doc.get("info_screen_text"),
        "remarks": doc.get("remarks"),
        "publication_settings": doc.get("publication_settings"),
        "target_groups": doc.get("target_groups"),
    }


@router.post("", response_model=ReservationOut, status_code=status.HTTP_201_CREATED)
async def create_reservation(payload: ReservationCreate):
    now = datetime.now(timezone.utc)
    doc = payload.model_dump(mode="json")
    doc["status"] = "pending"
    doc["created_at"] = now
    doc["updated_at"] = now

    result = await db.reservations.insert_one(doc)
    created = await db.reservations.find_one({"_id": result.inserted_id})

    if not created:
        raise HTTPException(status_code=500, detail="Reservation was not created")

    return reservation_to_response(created)


@router.get("")
async def list_reservations():
    items = []
    cursor = db.reservations.find().sort("created_at", -1)

    async for item in cursor:
        item["id"] = str(item.pop("_id"))
        items.append(item)

    return items

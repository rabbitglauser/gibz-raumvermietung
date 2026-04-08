from datetime import date, datetime, time, timezone
from enum import Enum
from typing import Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

from ..db import db

router = APIRouter(prefix="/reservations", tags=["reservations"])


class RoomId(str, Enum):
    seminarraum_5_003_004 = "seminarraum-5-003-004"
    seminarraum_2_112 = "seminarraum-2-112"
    aula_1_005 = "aula-1-005"


class OrganizerType(str, Enum):
    external_customer = "external_customer"
    public_sector_oda = "public_sector_oda"
    cantonal_admin_zug = "cantonal_admin_zug"
    gibz_internal_school_event = "gibz_internal_school_event"
    gibz_internal_private_event = "gibz_internal_private_event"


class ReservationStatus(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    rejected = "rejected"
    cancelled = "cancelled"


class SeatingType(str, Enum):
    seminar = "seminar"
    block = "block"
    theater = "theater"
    u_shape = "u_shape"
    banquet = "banquet"
    exam = "exam"


class EquipmentType(str, Enum):
    projector = "projector"
    flipchart = "flipchart"
    pinboard = "pinboard"
    visualizer = "visualizer"
    whiteboard = "whiteboard"
    laptop = "laptop"
    lectern = "lectern"
    stage = "stage"


ROOM_RULES = {
    RoomId.seminarraum_5_003_004: {
        "capacity": 36,
        "seating_types": {
            SeatingType.seminar,
            SeatingType.block,
            SeatingType.u_shape,
            SeatingType.exam,
        },
        "equipment": {
            EquipmentType.projector,
            EquipmentType.flipchart,
            EquipmentType.pinboard,
            EquipmentType.visualizer,
            EquipmentType.whiteboard,
        },
        "microphone": False,
        "technical_support": False,
    },
    RoomId.seminarraum_2_112: {
        "capacity": 24,
        "seating_types": {
            SeatingType.seminar,
            SeatingType.block,
            SeatingType.u_shape,
            SeatingType.exam,
        },
        "equipment": {
            EquipmentType.projector,
            EquipmentType.flipchart,
            EquipmentType.pinboard,
            EquipmentType.visualizer,
            EquipmentType.whiteboard,
        },
        "microphone": False,
        "technical_support": False,
    },
    RoomId.aula_1_005: {
        "capacity": 250,
        "seating_types": {
            SeatingType.theater,
            SeatingType.banquet,
            SeatingType.exam,
            SeatingType.block,
        },
        "equipment": {
            EquipmentType.projector,
            EquipmentType.flipchart,
            EquipmentType.pinboard,
            EquipmentType.whiteboard,
            EquipmentType.laptop,
            EquipmentType.lectern,
            EquipmentType.stage,
        },
        "microphone": True,
        "technical_support": True,
    },
}


def validate_room_capacity(payload: "ReservationCreate", rules: dict) -> None:
    if payload.attendee_count > rules["capacity"]:
        raise ValueError(
            f"{payload.room.value} supports at most {rules['capacity']} attendees"
        )


def validate_room_seating(payload: "ReservationCreate", rules: dict) -> None:
    if payload.setup.seating_type not in rules["seating_types"]:
        raise ValueError(
            f"{payload.setup.seating_type.value} seating is not supported for {payload.room.value}"
        )


def validate_room_equipment(payload: "ReservationCreate", rules: dict) -> None:
    requested_equipment = {item.type for item in payload.setup.equipment}
    unsupported_equipment = requested_equipment - rules["equipment"]
    if unsupported_equipment:
        names = ", ".join(sorted(item.value for item in unsupported_equipment))
        raise ValueError(f"Unsupported equipment for {payload.room.value}: {names}")


def validate_room_services(payload: "ReservationCreate", rules: dict) -> None:
    if payload.setup.microphone_needed and not rules["microphone"]:
        raise ValueError(f"Microphones are not supported for {payload.room.value}")
    if payload.setup.technical_support_hours and not rules["technical_support"]:
        raise ValueError(
            f"Technical support hours are not supported for {payload.room.value}"
        )
    if payload.setup.regie_hours and payload.room != RoomId.aula_1_005:
        raise ValueError(f"Regie hours are only supported for {RoomId.aula_1_005.value}")


def validate_room_rules(payload: "ReservationCreate") -> None:
    rules = ROOM_RULES[payload.room]
    validate_room_capacity(payload, rules)
    validate_room_seating(payload, rules)
    validate_room_equipment(payload, rules)
    validate_room_services(payload, rules)


class ContactInfo(BaseModel):
    name: str = Field(min_length=1)
    email: EmailStr
    phone: str = Field(min_length=1)
    department: Optional[str] = None


class BillingAddress(BaseModel):
    name: str = Field(min_length=1)
    street: str = Field(min_length=1)
    postal_code_city: str = Field(min_length=1)
    invoice_note: Optional[str] = None


class CateringWindow(BaseModel):
    enabled: bool = False
    from_time: Optional[time] = None
    to_time: Optional[time] = None

    @model_validator(mode="after")
    def validate_window(self) -> "CateringWindow":
        if not self.enabled:
            return self
        if self.from_time is None or self.to_time is None:
            raise ValueError("enabled catering windows require from_time and to_time")
        if self.from_time >= self.to_time:
            raise ValueError("catering from_time must be before to_time")
        return self


class CateringInfo(BaseModel):
    needed: bool = False
    before_event: CateringWindow = Field(default_factory=CateringWindow)
    during_event: CateringWindow = Field(default_factory=CateringWindow)
    after_event: CateringWindow = Field(default_factory=CateringWindow)

    @model_validator(mode="after")
    def validate_catering_windows(self) -> "CateringInfo":
        if not self.needed:
            return self
        if not any(
            (
                self.before_event.enabled,
                self.during_event.enabled,
                self.after_event.enabled,
            )
        ):
            raise ValueError("needed catering requires at least one enabled time window")
        return self


class EquipmentRequest(BaseModel):
    type: EquipmentType
    quantity: int = Field(gt=0)


class SetupInfo(BaseModel):
    seating_type: SeatingType
    equipment: list[EquipmentRequest] = Field(default_factory=list)
    microphone_needed: bool = False
    technical_support_hours: Optional[float] = Field(default=None, ge=0)
    regie_hours: Optional[float] = Field(default=None, ge=0)


class PublicationInfo(BaseModel):
    info_screen_text: Optional[str] = None
    publish_on_info_screen: bool = False
    publish_target_groups: list[str] = Field(default_factory=list)


class ReservationCreate(BaseModel):
    event_name: str = Field(min_length=1)
    date: date
    setup_start_time: time
    start_time: time
    end_time: time
    room: RoomId
    attendee_count: int = Field(gt=0)
    organizer_type: OrganizerType
    contact: ContactInfo
    billing_address: BillingAddress
    catering: CateringInfo = Field(default_factory=CateringInfo)
    setup: SetupInfo
    publication: Optional[PublicationInfo] = None
    remarks: Optional[str] = None
    terms_accepted: bool

    @field_validator("terms_accepted")
    @classmethod
    def validate_terms_accepted(cls, value: bool) -> bool:
        if not value:
            raise ValueError("terms_accepted must be true")
        return value

    @model_validator(mode="after")
    def validate_business_rules(self) -> "ReservationCreate":
        if self.setup_start_time > self.start_time:
            raise ValueError("setup_start_time must be before or equal to start_time")
        if self.start_time >= self.end_time:
            raise ValueError("start_time must be before end_time")

        validate_room_rules(self)
        return self


class ReservationOut(ReservationCreate):
    id: str
    status: ReservationStatus
    created_at: datetime
    updated_at: datetime


class ReservationList(BaseModel):
    items: list[ReservationOut]


def reservation_to_response(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "event_name": doc["event_name"],
        "date": doc["date"],
        "setup_start_time": doc["setup_start_time"],
        "start_time": doc["start_time"],
        "end_time": doc["end_time"],
        "room": doc["room"],
        "attendee_count": doc["attendee_count"],
        "organizer_type": doc["organizer_type"],
        "contact": doc["contact"],
        "billing_address": doc["billing_address"],
        "catering": doc.get("catering", {}),
        "setup": doc["setup"],
        "publication": doc.get("publication"),
        "remarks": doc.get("remarks"),
        "terms_accepted": doc["terms_accepted"],
        "status": doc["status"],
        "created_at": doc["created_at"],
        "updated_at": doc["updated_at"],
    }


async def has_reservation_conflict(payload: ReservationCreate) -> bool:
    conflict_filter = {
        "room": payload.room.value,
        "date": payload.date.isoformat(),
        "status": {"$nin": [ReservationStatus.cancelled.value, ReservationStatus.rejected.value]},
        "setup_start_time": {"$lt": payload.end_time.isoformat()},
        "end_time": {"$gt": payload.setup_start_time.isoformat()},
    }
    return await db.reservations.find_one(conflict_filter) is not None


@router.post("", response_model=ReservationOut, status_code=status.HTTP_201_CREATED)
async def create_reservation(payload: ReservationCreate):
    if await has_reservation_conflict(payload):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The selected room is already reserved during this time window",
        )

    now = datetime.now(timezone.utc)
    doc = payload.model_dump(mode="json")
    doc["status"] = ReservationStatus.pending.value
    doc["created_at"] = now
    doc["updated_at"] = now

    result = await db.reservations.insert_one(doc)
    created = await db.reservations.find_one({"_id": result.inserted_id})

    if not created:
        raise HTTPException(status_code=500, detail="Reservation was not created")

    return reservation_to_response(created)


@router.get("", response_model=ReservationList)
async def list_reservations():
    items = []
    cursor = db.reservations.find().sort("created_at", -1)

    async for item in cursor:
        items.append(reservation_to_response(item))

    return {"items": items}

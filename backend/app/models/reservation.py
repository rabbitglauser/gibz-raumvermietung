from datetime import date, datetime, time
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

from .enums import (
    EquipmentType,
    OrganizerType,
    ReservationStatus,
    RoomId,
    SeatingType,
)

BOOKING_WINDOW_START = time(7, 0)   # earliest allowed setup_start_time
BOOKING_WINDOW_END = time(22, 0)    # latest allowed end_time


# Per-room rule table. Edit this when adding/changing a room — do not add
# room-specific branches in handlers, services, or DAOs.
ROOM_RULES = {
    RoomId.seminarraum_5_003_004: {
        "capacity": 100,
        "seating_types": {
            SeatingType.seminar,
            SeatingType.theater,
            SeatingType.u_shape,
            SeatingType.exam,
        },
        "equipment": {
            EquipmentType.projector,
            EquipmentType.flipchart,
            EquipmentType.pinboard,
            EquipmentType.visualizer,
            EquipmentType.whiteboard,
            EquipmentType.lectern,
        },
        "microphone": True,
        "technical_support": False,
    },
    RoomId.seminarraum_2_112: {
        "capacity": 50,
        "seating_types": {
            SeatingType.seminar,
            SeatingType.theater,
            SeatingType.u_shape,
            SeatingType.exam,
        },
        "equipment": {
            EquipmentType.projector,
            EquipmentType.flipchart,
            EquipmentType.pinboard,
            EquipmentType.visualizer,
        },
        "microphone": False,
        "technical_support": False,
    },
    RoomId.aula_1_005: {
        "capacity": 330,
        "seating_types": {
            SeatingType.theater,
            SeatingType.seminar,
            SeatingType.exam,
            SeatingType.u_shape,
        },
        "equipment": {
            EquipmentType.projector,
            EquipmentType.flipchart,
            EquipmentType.pinboard,
            EquipmentType.laptop,
            EquipmentType.lectern,
            EquipmentType.stage,
        },
        "microphone": True,
        "technical_support": True,
    },
}


def _validate_room_capacity(payload: "ReservationCreate", rules: dict) -> None:
    if payload.attendee_count > rules["capacity"]:
        raise ValueError(
            f"Dieser Raum fasst maximal {rules['capacity']} Personen"
        )


def _validate_room_seating(payload: "ReservationCreate", rules: dict) -> None:
    if payload.setup.seating_type not in rules["seating_types"]:
        raise ValueError(
            f"Die Bestuhlung «{payload.setup.seating_type.value}» ist für diesen Raum nicht verfügbar"
        )


def _validate_room_equipment(payload: "ReservationCreate", rules: dict) -> None:
    requested_equipment = {item.type for item in payload.setup.equipment}
    unsupported_equipment = requested_equipment - rules["equipment"]
    if unsupported_equipment:
        names = ", ".join(sorted(item.value for item in unsupported_equipment))
        raise ValueError(f"Folgendes Material ist in diesem Raum nicht verfügbar: {names}")


def _validate_room_services(payload: "ReservationCreate", rules: dict) -> None:
    if payload.setup.microphone_needed and not rules["microphone"]:
        raise ValueError("Eine Mikrofonanlage ist in diesem Raum nicht verfügbar")
    if payload.setup.technical_support_hours and not rules["technical_support"]:
        raise ValueError("Technischer Support ist in diesem Raum nicht verfügbar")
    if payload.setup.regie_hours and payload.room != RoomId.aula_1_005:
        raise ValueError("Regie-Stunden sind nur in der Aula verfügbar")


def validate_room_rules(payload: "ReservationCreate") -> None:
    rules = ROOM_RULES[payload.room]
    _validate_room_capacity(payload, rules)
    _validate_room_seating(payload, rules)
    _validate_room_equipment(payload, rules)
    _validate_room_services(payload, rules)


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
            raise ValueError("Für aktivierte Verpflegungsfenster müssen Von- und Bis-Zeit angegeben werden")
        if self.from_time >= self.to_time:
            raise ValueError("Die Von-Zeit muss vor der Bis-Zeit liegen")
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
            raise ValueError("Wenn Verpflegung benötigt wird, muss mindestens ein Zeitfenster aktiviert sein")
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
            raise ValueError("AGB müssen akzeptiert werden")
        return value

    @model_validator(mode="after")
    def validate_business_rules(self) -> "ReservationCreate":
        if self.setup_start_time > self.start_time:
            raise ValueError("Aufbauzeit darf nicht nach der Startzeit liegen")

        if self.start_time >= self.end_time:
            raise ValueError("Startzeit muss vor der Endzeit liegen")

        if self.setup_start_time < BOOKING_WINDOW_START:
            raise ValueError(
                f"Reservationen können nicht vor {BOOKING_WINDOW_START.strftime('%H:%M')} beginnen"
            )

        if self.end_time > BOOKING_WINDOW_END:
            raise ValueError(
                f"Reservationen können nicht nach {BOOKING_WINDOW_END.strftime('%H:%M')} enden"
            )

        validate_room_rules(self)
        return self


class ReservationOut(ReservationCreate):
    id: str
    status: ReservationStatus
    edit_token: Optional[str] = None
    reminder_sent_at: Optional[datetime] = None
    reminder_count: int = 0
    created_at: datetime
    updated_at: datetime


class ReservationCreated(ReservationOut):
    """Create response — the only place the edit token is ever returned."""

    edit_token: str


class ReservationList(BaseModel):
    items: list[ReservationOut]


class AvailabilitySlot(BaseModel):
    """Public-safe view of a booked slot — no customer data."""

    room: RoomId
    date: date
    setup_start_time: time
    end_time: time


class AvailabilityList(BaseModel):
    items: list[AvailabilitySlot]


class ReservationUpdate(BaseModel):
    """Fields a customer may change before the edit deadline.

    Date, time, and room are intentionally excluded — changing those would
    affect availability/conflict detection, which is staff-only.
    """

    attendee_count: Optional[int] = Field(default=None, gt=0)
    contact: Optional[ContactInfo] = None
    billing_address: Optional[BillingAddress] = None
    catering: Optional[CateringInfo] = None
    setup: Optional[SetupInfo] = None
    publication: Optional[PublicationInfo] = None
    remarks: Optional[str] = None


class StaffReservationUpdate(ReservationUpdate):
    """Staff may additionally change scheduling fields and the status."""

    status: Optional[ReservationStatus] = None
    date: Optional[date] = None
    setup_start_time: Optional[time] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    room: Optional[RoomId] = None


# Fields that make up a full ReservationCreate — used to rebuild and
# re-validate a stored document after a partial update.
CREATE_FIELDS = tuple(ReservationCreate.model_fields.keys())


def doc_to_create_dict(doc: dict) -> dict:
    """Extract the ReservationCreate-shaped subset of a stored document."""
    return {field: doc[field] for field in CREATE_FIELDS if field in doc}


def reservation_is_incomplete(doc: dict) -> bool:
    """A reservation still needs customer input if catering is requested
    but has no enabled window, or no setup details have been provided.

    Used by the reminder job to decide whether to nudge the customer.
    """
    catering = doc.get("catering") or {}
    if catering.get("needed"):
        windows = ("before_event", "during_event", "after_event")
        if not any((catering.get(w) or {}).get("enabled") for w in windows):
            return True

    setup = doc.get("setup") or {}
    if not setup.get("seating_type"):
        return True

    return False


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
        "edit_token": doc.get("edit_token"),
        "reminder_sent_at": doc.get("reminder_sent_at"),
        "reminder_count": doc.get("reminder_count", 0),
        "created_at": doc["created_at"],
        "updated_at": doc["updated_at"],
    }

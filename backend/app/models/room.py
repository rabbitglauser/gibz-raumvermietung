from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from .enums import EquipmentType, OrganizerType, RoomId, SeatingType


class RoomContact(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None


class SeatingOption(BaseModel):
    type: SeatingType
    label: str
    max_people: Optional[int] = Field(default=None, gt=0)
    max_tables: Optional[int] = Field(default=None, gt=0)
    recommended_tables: Optional[int] = Field(default=None, gt=0)
    table_size: Optional[str] = None
    max_chairs_per_table: Optional[int] = Field(default=None, gt=0)
    recommended_chairs_per_table: Optional[int] = Field(default=None, gt=0)
    notes: list[str] = Field(default_factory=list)


class AdditionalMaterial(BaseModel):
    name: str
    max_quantity: Optional[int] = Field(default=None, gt=0)
    dimensions: Optional[str] = None
    notes: list[str] = Field(default_factory=list)


class MicrophoneOption(BaseModel):
    kind: str
    quantity: int = Field(gt=0)


class RoomPrice(BaseModel):
    organizer_type: OrganizerType
    label: str
    half_day_chf: Optional[int] = Field(default=None, ge=0)
    full_day_chf: Optional[int] = Field(default=None, ge=0)
    note: Optional[str] = None


class CateringDetails(BaseModel):
    required: bool = True
    provider: str
    contact: RoomContact
    notes: list[str] = Field(default_factory=list)


class ReservationDetails(BaseModel):
    send_to_email: EmailStr
    catering_send_to_email: EmailStr
    approval_date: Optional[str] = None
    approved_by: Optional[str] = None


class Room(BaseModel):
    room_id: RoomId
    sort_order: int = Field(gt=0)
    name: str
    room_number: str
    building: str
    floor: str
    area_m2: int = Field(gt=0)
    location: str
    description: str
    image_path: Optional[str] = None
    image_note: Optional[str] = None
    capacity: int = Field(gt=0)
    seating_types: list[SeatingType]
    equipment: list[EquipmentType]
    microphone: bool = False
    technical_support: bool = False
    inspection_contact: RoomContact
    fixed_setup: list[str] = Field(default_factory=list)
    notebook_connections: list[str] = Field(default_factory=list)
    internet_access: list[str] = Field(default_factory=list)
    seating_options: list[SeatingOption] = Field(default_factory=list)
    additional_material: list[AdditionalMaterial] = Field(default_factory=list)
    microphones: list[MicrophoneOption] = Field(default_factory=list)
    microphone_notes: list[str] = Field(default_factory=list)
    pricing: list[RoomPrice] = Field(default_factory=list)
    catering: CateringDetails
    reservation: ReservationDetails
    reservation_notes: list[str] = Field(default_factory=list)
    publication_options: list[str] = Field(default_factory=list)


class RoomList(BaseModel):
    items: list[Room]


def room_to_response(doc: dict) -> dict:
    return Room.model_validate(doc).model_dump(mode="json")

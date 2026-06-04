from enum import Enum


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


class UserRole(str, Enum):
    admin = "admin"
    staff = "staff"
    secretariat = "secretariat"
    hausdienst = "hausdienst"
    restaurant_treff = "restaurant_treff"

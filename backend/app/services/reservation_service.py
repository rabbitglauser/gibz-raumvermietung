from datetime import date, datetime, time, timedelta, timezone
from typing import Optional

from ..config import settings
from ..dao.reservation_dao import ReservationDAO
from ..models.enums import ReservationStatus
from ..models.reservation import ReservationCreate, reservation_to_response


class ReservationConflictError(Exception):
    """Raised when a reservation overlaps with an existing one."""


class ReservationNotFoundError(Exception):
    """Raised when a reservation cannot be found by the given token."""


class ReservationEditDeadlineError(Exception):
    """Raised when an edit attempt is made after the configurable deadline."""


def _is_past_edit_deadline(doc: dict, deadline_hours: int) -> bool:
    event_date = date.fromisoformat(doc["date"])
    time_str = doc["start_time"]
    if len(time_str) == 5:
        time_str += ":00"
    event_start = time.fromisoformat(time_str)
    event_datetime = datetime.combine(event_date, event_start, tzinfo=timezone.utc)
    deadline = event_datetime - timedelta(hours=deadline_hours)
    return datetime.now(timezone.utc) >= deadline


class ReservationService:
    """Application logic for reservations.

    Routes call this; this calls the DAO. Keeps the conflict-detection
    rule and the doc->response mapping out of HTTP handlers.
    """

    def __init__(self, dao: ReservationDAO) -> None:
        self.dao = dao

    async def create(self, payload: ReservationCreate) -> dict:
        if await self.dao.has_conflict(payload):
            raise ReservationConflictError(
                "The selected room is already reserved during this time window"
            )
        created = await self.dao.create(payload)
        if created is None:
            raise RuntimeError("Reservation was not created")
        return reservation_to_response(created)

    async def list_all(self) -> list[dict]:
        docs = await self.dao.list_all()
        return [reservation_to_response(doc) for doc in docs]

    async def get_by_id(self, reservation_id: str) -> Optional[dict]:
        doc = await self.dao.get_by_id(reservation_id)
        return reservation_to_response(doc) if doc else None

    async def get_by_edit_token(self, token: str) -> dict:
        doc = await self.dao.get_by_edit_token(token)
        if doc is None:
            raise ReservationNotFoundError("No reservation found for this edit link")
        return reservation_to_response(doc)

    async def update_reservation(self, token: str, payload: ReservationCreate) -> dict:
        doc = await self.dao.get_by_edit_token(token)
        if doc is None:
            raise ReservationNotFoundError("No reservation found for this edit link")
        if _is_past_edit_deadline(doc, settings.edit_deadline_hours):
            raise ReservationEditDeadlineError(
                f"Reservations can no longer be edited within "
                f"{settings.edit_deadline_hours} hours of the event start time"
            )
        reservation_id = str(doc["_id"])
        if await self.dao.has_conflict(payload, exclude_id=reservation_id):
            raise ReservationConflictError(
                "The selected room is already reserved during this time window"
            )
        updated = await self.dao.update_reservation(reservation_id, payload)
        if updated is None:
            raise RuntimeError("Reservation was not updated")
        return reservation_to_response(updated)

    async def update_status(
        self, reservation_id: str, status: ReservationStatus
    ) -> Optional[dict]:
        doc = await self.dao.update_status(reservation_id, status)
        return reservation_to_response(doc) if doc else None

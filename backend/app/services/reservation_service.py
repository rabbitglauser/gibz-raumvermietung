from datetime import date, timedelta
from typing import Optional

from pydantic import ValidationError

from ..config import settings
from ..dao.reservation_dao import ReservationDAO
from ..models.enums import ReservationStatus
from ..models.reservation import (
    ReservationCreate,
    ReservationUpdate,
    StaffReservationUpdate,
    doc_to_create_dict,
    reservation_to_response,
)

# Scheduling fields that, when changed by staff, require a fresh conflict check.
_SCHEDULING_FIELDS = {"date", "setup_start_time", "end_time", "start_time", "room"}


class ReservationConflictError(Exception):
    """Raised when a reservation overlaps with an existing one."""


class ReservationNotFoundError(Exception):
    """Raised when a reservation id/token does not resolve."""


class EditDeadlinePassedError(Exception):
    """Raised when a customer edits past the configured deadline."""


class ReservationValidationError(Exception):
    """Raised when a merged update no longer satisfies the model rules."""


class ReservationService:
    """Application logic for reservations.

    Routes call this; this calls the DAO. Keeps conflict detection, the
    edit-deadline rule, and the doc->response mapping out of HTTP handlers.
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
        response = reservation_to_response(created)
        response["edit_token"] = created["edit_token"]
        return response

    async def list_all(self, filters: Optional[dict] = None) -> list[dict]:
        docs = await self.dao.list_all(filters)
        return [reservation_to_response(doc) for doc in docs]

    async def get_by_id(self, reservation_id: str) -> Optional[dict]:
        doc = await self.dao.get_by_id(reservation_id)
        return reservation_to_response(doc) if doc else None

    async def get_by_token(self, edit_token: str) -> Optional[dict]:
        doc = await self.dao.get_by_token(edit_token)
        return reservation_to_response(doc) if doc else None

    async def availability(self, room: Optional[str] = None) -> list[dict]:
        docs = await self.dao.list_active(room)
        return [
            {
                "room": doc["room"],
                "date": doc["date"],
                "setup_start_time": doc["setup_start_time"],
                "end_time": doc["end_time"],
            }
            for doc in docs
        ]

    def edit_deadline(self, event_date: date) -> date:
        """Last day on which a customer may still edit a reservation."""
        return event_date - timedelta(days=settings.edit_deadline_days)

    async def customer_update(
        self,
        edit_token: str,
        update: ReservationUpdate,
        today: Optional[date] = None,
    ) -> dict:
        doc = await self.dao.get_by_token(edit_token)
        if doc is None:
            raise ReservationNotFoundError("Reservation not found")

        today = today or date.today()
        event_date = date.fromisoformat(doc["date"])
        if today > self.edit_deadline(event_date):
            raise EditDeadlinePassedError(
                "The edit deadline for this reservation has passed"
            )

        return await self._apply_update(doc, update, allow_scheduling=False)

    async def staff_update(
        self, reservation_id: str, update: StaffReservationUpdate
    ) -> Optional[dict]:
        doc = await self.dao.get_by_id(reservation_id)
        if doc is None:
            return None
        return await self._apply_update(doc, update, allow_scheduling=True)

    async def update_status(
        self, reservation_id: str, status: ReservationStatus
    ) -> Optional[dict]:
        doc = await self.dao.update_status(reservation_id, status)
        return reservation_to_response(doc) if doc else None

    async def delete(self, reservation_id: str) -> bool:
        return await self.dao.delete(reservation_id)

    async def _apply_update(
        self, doc: dict, update: ReservationUpdate, allow_scheduling: bool
    ) -> dict:
        patch = update.model_dump(mode="json", exclude_unset=True)
        status = patch.pop("status", None) if allow_scheduling else None

        # Re-validate the full reservation by merging the patch onto the
        # stored document and reconstructing the create model. This reuses
        # every business/room rule instead of duplicating them here.
        merged = {**doc_to_create_dict(doc), **patch}
        try:
            validated = ReservationCreate.model_validate(merged)
        except ValidationError as exc:
            raise ReservationValidationError(str(exc)) from exc

        if allow_scheduling and _SCHEDULING_FIELDS.intersection(patch):
            if await self.dao.has_conflict(validated, exclude_id=doc["_id"]):
                raise ReservationConflictError(
                    "The selected room is already reserved during this time window"
                )

        fields = {key: patch[key] for key in patch}
        if status is not None:
            fields["status"] = status

        updated = await self.dao.update_fields(doc["_id"], fields)
        return reservation_to_response(updated)

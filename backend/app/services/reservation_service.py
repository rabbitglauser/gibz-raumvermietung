from typing import Optional

from ..dao.reservation_dao import ReservationDAO
from ..models.enums import ReservationStatus
from ..models.reservation import ReservationCreate, reservation_to_response


class ReservationConflictError(Exception):
    """Raised when a reservation overlaps with an existing one."""


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

    async def update_status(
        self, reservation_id: str, status: ReservationStatus
    ) -> Optional[dict]:
        doc = await self.dao.update_status(reservation_id, status)
        return reservation_to_response(doc) if doc else None

    async def delete(self, reservation_id: str) -> bool:
        return await self.dao.delete(reservation_id)

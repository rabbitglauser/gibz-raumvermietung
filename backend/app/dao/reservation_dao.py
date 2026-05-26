import uuid
from datetime import datetime, timezone
from typing import Optional

from ..models.reservation import ReservationCreate
from ..models.enums import ReservationStatus


class ReservationDAO:
    """Mongo data access for the `reservations` collection.

    Holds a reference to a database object (anything that exposes a
    `.reservations` attribute returning a Mongo-like async collection).
    Tests inject a fake database; production code uses the live
    `AsyncMongoClient` database.
    """

    def __init__(self, database) -> None:
        self.collection = database.reservations

    async def create(self, payload: ReservationCreate) -> dict:
        now = datetime.now(timezone.utc)
        doc = payload.model_dump(mode="json")
        doc["status"] = ReservationStatus.pending.value
        doc["edit_token"] = str(uuid.uuid4())
        doc["created_at"] = now
        doc["updated_at"] = now

        result = await self.collection.insert_one(doc)
        created = await self.collection.find_one({"_id": result.inserted_id})
        return created

    async def get_by_id(self, reservation_id: str) -> Optional[dict]:
        return await self.collection.find_one({"_id": reservation_id})

    async def get_by_edit_token(self, token: str) -> Optional[dict]:
        return await self.collection.find_one({"edit_token": token})

    async def list_all(self, filters: Optional[dict] = None) -> list[dict]:
        items: list[dict] = []
        cursor = self.collection.find(filters or {}).sort("created_at", -1)
        async for item in cursor:
            items.append(item)
        return items

    async def has_conflict(
        self, payload: ReservationCreate, exclude_id: Optional[str] = None
    ) -> bool:
        # Overlap detection: two reservations conflict iff
        #   existing.setup_start_time < new.end_time
        #   AND existing.end_time > new.setup_start_time
        # Adjacent bookings (one ends exactly when another starts) are allowed
        # because the comparisons are strict.
        # Times are stored as zero-padded ISO strings, so lexicographic
        # comparison matches chronological comparison.
        conflict_filter: dict = {
            "room": payload.room.value,
            "date": payload.date.isoformat(),
            "status": {
                "$nin": [
                    ReservationStatus.cancelled.value,
                    ReservationStatus.rejected.value,
                ]
            },
            "setup_start_time": {"$lt": payload.end_time.isoformat()},
            "end_time": {"$gt": payload.setup_start_time.isoformat()},
        }
        if exclude_id is not None:
            conflict_filter["_id"] = {"$ne": exclude_id}
        return await self.collection.find_one(conflict_filter) is not None

    async def update_reservation(
        self, reservation_id: str, payload: ReservationCreate
    ) -> Optional[dict]:
        now = datetime.now(timezone.utc)
        updates = payload.model_dump(mode="json")
        updates["updated_at"] = now
        await self.collection.update_one(
            {"_id": reservation_id},
            {"$set": updates},
        )
        return await self.get_by_id(reservation_id)

    async def update_status(
        self, reservation_id: str, status: ReservationStatus
    ) -> Optional[dict]:
        await self.collection.update_one(
            {"_id": reservation_id},
            {
                "$set": {
                    "status": status.value,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )
        return await self.get_by_id(reservation_id)

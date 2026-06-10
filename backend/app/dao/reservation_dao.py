import uuid
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId

from ..models.reservation import ReservationCreate
from ..models.enums import ReservationStatus


def _id_filter(reservation_id):
    """Match either an ObjectId-backed _id (production) or a string _id (tests/legacy).

    MongoDB stores auto-generated `_id`s as ObjectIds, but the API exposes them as
    hex strings via `str(doc["_id"])`. A raw string never matches a stored ObjectId,
    so coerce it here. Non-ObjectId strings (the in-memory test mock, any legacy
    string ids) fall through unchanged.
    """
    try:
        return ObjectId(reservation_id)
    except (InvalidId, TypeError):
        return reservation_id


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
        return await self.collection.find_one({"_id": _id_filter(reservation_id)})

    async def get_by_edit_token(self, token: str) -> Optional[dict]:
        return await self.collection.find_one({"edit_token": token})

    # Alias used by the customer edit / availability flows.
    async def get_by_token(self, token: str) -> Optional[dict]:
        return await self.collection.find_one({"edit_token": token})

    async def list_all(self, filters: Optional[dict] = None) -> list[dict]:
        items: list[dict] = []
        cursor = self.collection.find(filters or {}).sort("created_at", -1)
        async for item in cursor:
            items.append(item)
        return items

    async def list_active(self, room: Optional[str] = None) -> list[dict]:
        """Reservations that still occupy a slot (everything except cancelled/rejected).

        Backs the public availability endpoint, optionally scoped to one room.
        """
        query: dict = {
            "status": {
                "$nin": [
                    ReservationStatus.cancelled.value,
                    ReservationStatus.rejected.value,
                ]
            }
        }
        if room:
            query["room"] = room

        items: list[dict] = []
        cursor = self.collection.find(query).sort("date", 1)
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
            conflict_filter["_id"] = {"$ne": _id_filter(exclude_id)}
        return await self.collection.find_one(conflict_filter) is not None

    async def update_reservation(
        self, reservation_id: str, payload: ReservationCreate
    ) -> Optional[dict]:
        now = datetime.now(timezone.utc)
        updates = payload.model_dump(mode="json")
        updates["updated_at"] = now
        await self.collection.update_one(
            {"_id": _id_filter(reservation_id)},
            {"$set": updates},
        )
        return await self.get_by_id(reservation_id)

    async def update_status(
        self, reservation_id: str, status: ReservationStatus
    ) -> Optional[dict]:
        await self.collection.update_one(
            {"_id": _id_filter(reservation_id)},
            {
                "$set": {
                    "status": status.value,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )
        return await self.get_by_id(reservation_id)

    async def update_fields(
        self, reservation_id: str, fields: dict
    ) -> Optional[dict]:
        """Apply a partial `$set` of already-serialized fields, bumping updated_at."""
        if fields:
            await self.collection.update_one(
                {"_id": _id_filter(reservation_id)},
                {"$set": {**fields, "updated_at": datetime.now(timezone.utc)}},
            )
        return await self.get_by_id(reservation_id)

    async def delete(self, reservation_id: str) -> bool:
        result = await self.collection.delete_one(
            {"_id": _id_filter(reservation_id)}
        )
        return getattr(result, "deleted_count", 0) > 0

    async def list_reminder_candidates(self, from_date: str, to_date: str) -> list[dict]:
        items: list[dict] = []
        cursor = self.collection.find(
            {
                "date": {"$gte": from_date, "$lte": to_date},
                "status": {
                    "$nin": [
                        ReservationStatus.cancelled.value,
                        ReservationStatus.rejected.value,
                    ]
                },
            }
        ).sort("date", 1)
        async for item in cursor:
            items.append(item)
        return items

    async def mark_reminder_sent(self, reservation_id: str) -> Optional[dict]:
        doc = await self.get_by_id(reservation_id)
        if doc is None:
            return None
        await self.collection.update_one(
            {"_id": _id_filter(reservation_id)},
            {
                "$set": {
                    "reminder_sent_at": datetime.now(timezone.utc),
                    "reminder_count": doc.get("reminder_count", 0) + 1,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )
        return await self.get_by_id(reservation_id)


class ReminderLogDAO:
    """Append-only audit log for reminder send attempts."""

    def __init__(self, database) -> None:
        self.collection = database.reminder_log

    async def record(
        self,
        *,
        reservation_id: str,
        status: str,
        missing_fields: Optional[list[str]] = None,
        error: Optional[str] = None,
    ) -> None:
        await self.collection.insert_one(
            {
                "reservation_id": reservation_id,
                "status": status,
                "missing_fields": list(missing_fields or []),
                "error": error,
                "attempted_at": datetime.now(timezone.utc),
            }
        )

    async def list_for_reservation(self, reservation_id: str) -> list[dict]:
        items: list[dict] = []
        cursor = self.collection.find({"reservation_id": reservation_id}).sort(
            "attempted_at", 1
        )
        async for item in cursor:
            items.append(item)
        return items

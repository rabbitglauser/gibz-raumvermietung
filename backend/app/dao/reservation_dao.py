import secrets
from datetime import date, datetime, timezone
from typing import Optional

from ..models.enums import ReservationStatus
from ..models.reservation import ReservationCreate


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
        doc["edit_token"] = secrets.token_urlsafe(32)
        doc["reminder_sent"] = False
        doc["reminder_count"] = 0
        doc["created_at"] = now
        doc["updated_at"] = now

        result = await self.collection.insert_one(doc)
        created = await self.collection.find_one({"_id": result.inserted_id})
        return created

    async def get_by_id(self, reservation_id: str) -> Optional[dict]:
        return await self.collection.find_one({"_id": reservation_id})

    async def get_by_token(self, edit_token: str) -> Optional[dict]:
        return await self.collection.find_one({"edit_token": edit_token})

    async def get_by_edit_token(self, token: str) -> Optional[dict]:
        return await self.get_by_token(token)

    async def list_all(self, filters: Optional[dict] = None) -> list[dict]:
        query = self._build_filter(filters or {})
        items: list[dict] = []
        cursor = self.collection.find(query).sort("date", 1)
        async for item in cursor:
            items.append(item)
        return items

    def _build_filter(self, filters: dict) -> dict:
        query: dict = {}

        date_from = filters.get("date_from")
        date_to = filters.get("date_to")
        if date_from or date_to:
            date_query: dict = {}
            if date_from:
                date_query["$gte"] = date_from
            if date_to:
                date_query["$lte"] = date_to
            query["date"] = date_query

        if filters.get("upcoming"):
            today = date.today().isoformat()
            query.setdefault("date", {})["$gte"] = today

        if filters.get("past"):
            today = date.today().isoformat()
            query.setdefault("date", {})["$lt"] = today

        has_catering = filters.get("has_catering")
        if has_catering is not None:
            query["catering.needed"] = bool(has_catering)

        status = filters.get("status")
        if status:
            query["status"] = status

        text = filters.get("q")
        if text:
            query["$or"] = [
                {"event_name": {"$regex": text, "$options": "i"}},
                {"contact.name": {"$regex": text, "$options": "i"}},
                {"room": {"$regex": text, "$options": "i"}},
            ]

        return query

    async def list_active(self, room: Optional[str] = None) -> list[dict]:
        """Non-cancelled/rejected reservations, optionally for one room."""
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
        async for item in self.collection.find(query).sort("date", 1):
            items.append(item)
        return items

    async def has_conflict(
        self, payload: ReservationCreate, exclude_id: Optional[str] = None
    ) -> bool:
        # Overlap detection: two reservations conflict iff
        #   existing.setup_start_time < new.end_time
        #   AND existing.end_time > new.setup_start_time
        # Adjacent bookings are allowed because the comparisons are strict.
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

    async def update_fields(self, reservation_id: str, fields: dict) -> Optional[dict]:
        fields = {**fields, "updated_at": datetime.now(timezone.utc)}

        await self.collection.update_one(
            {"_id": reservation_id},
            {"$set": fields},
        )

        return await self.get_by_id(reservation_id)

    async def update_reservation(
        self, reservation_id: str, payload: ReservationCreate
    ) -> Optional[dict]:
        updates = payload.model_dump(mode="json")
        return await self.update_fields(reservation_id, updates)

    async def update_status(
        self, reservation_id: str, status: ReservationStatus
    ) -> Optional[dict]:
        return await self.update_fields(reservation_id, {"status": status.value})

    async def delete(self, reservation_id: str) -> bool:
        result = await self.collection.delete_one({"_id": reservation_id})
        return result.deleted_count > 0

    async def list_pending_reminders(self, cutoff_date: str) -> list[dict]:
        """Active reservations on or before `cutoff_date` that have not yet
        been reminded.
        """
        query = {
            "reminder_sent": {"$ne": True},
            "date": {"$lte": cutoff_date},
            "status": {
                "$nin": [
                    ReservationStatus.cancelled.value,
                    ReservationStatus.rejected.value,
                ]
            },
        }

        items: list[dict] = []
        async for item in self.collection.find(query):
            items.append(item)
        return items

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

        now = datetime.now(timezone.utc)

        await self.collection.update_one(
            {"_id": reservation_id},
            {
                "$set": {
                    "reminder_sent": True,
                    "reminder_sent_at": now,
                    "reminder_count": int(doc.get("reminder_count") or 0) + 1,
                    "updated_at": now,
                }
            },
        )

        return await self.get_by_id(reservation_id)
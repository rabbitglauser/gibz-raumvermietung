"""Direct unit tests for the DAO/service layer (no HTTP).

Covers the create + conflict-detection path through ReservationService
and basic RoomDAO retrieval. Uses asyncio.run rather than
pytest-asyncio (which is not in requirements-dev).
"""

import asyncio
import json
import sys
from pathlib import Path
from types import ModuleType, SimpleNamespace
from unittest.mock import AsyncMock

import pytest

fake_db_module = ModuleType("app.db")
fake_db_module.db = SimpleNamespace()
fake_db_module.ping_db = AsyncMock(return_value=True)
fake_db_module.get_database = lambda: fake_db_module.db
sys.modules.setdefault("app.db", fake_db_module)

from app.dao.reservation_dao import ReservationDAO  # noqa: E402
from app.dao.room_dao import RoomDAO  # noqa: E402
from app.models.reservation import ReservationCreate  # noqa: E402
from app.services.reservation_service import (  # noqa: E402
    ReservationConflictError,
    ReservationService,
)
from app.services.room_service import RoomService  # noqa: E402

from .mocks import MockReservationsCollection, MockRoomsCollection  # noqa: E402


SEED_ROOMS = json.loads(
    (Path(__file__).resolve().parents[2] / "database" / "seeds" / "rooms.json").read_text(
        encoding="utf-8"
    )
)


def _payload(**overrides) -> ReservationCreate:
    base = {
        "event_name": "Workshop",
        "date": "2026-07-01",
        "setup_start_time": "08:30",
        "start_time": "09:00",
        "end_time": "12:00",
        "room": "seminarraum-2-112",
        "attendee_count": 20,
        "organizer_type": "gibz_internal_school_event",
        "contact": {
            "name": "Test User",
            "email": "test@example.com",
            "phone": "+41 41 123 45 67",
        },
        "billing_address": {
            "name": "GIBZ",
            "street": "Industriestrasse 52",
            "postal_code_city": "6300 Zug",
        },
        "setup": {
            "seating_type": "seminar",
            "equipment": [{"type": "projector", "quantity": 1}],
        },
        "terms_accepted": True,
    }
    base.update(overrides)
    return ReservationCreate.model_validate(base)


def _make_reservation_service() -> tuple[ReservationService, MockReservationsCollection]:
    collection = MockReservationsCollection()
    service = ReservationService(ReservationDAO(SimpleNamespace(reservations=collection)))
    return service, collection


def test_service_creates_reservation_through_dao():
    service, collection = _make_reservation_service()

    result = asyncio.run(service.create(_payload()))

    assert result["id"] == "reservation-1"
    assert result["status"] == "pending"
    assert collection.documents[0]["event_name"] == "Workshop"


def test_service_lists_reservations():
    service, _ = _make_reservation_service()

    async def scenario():
        await service.create(_payload(event_name="One"))
        await service.create(
            _payload(
                event_name="Two",
                setup_start_time="12:00",
                start_time="12:30",
                end_time="14:00",
            )
        )
        return await service.list_all()

    items = asyncio.run(scenario())
    assert len(items) == 2
    assert {item["event_name"] for item in items} == {"One", "Two"}


def test_service_rejects_overlapping_reservation():
    service, _ = _make_reservation_service()

    async def scenario():
        await service.create(_payload())
        await service.create(
            _payload(
                event_name="Overlap",
                setup_start_time="10:00",
                start_time="10:30",
                end_time="13:00",
            )
        )

    with pytest.raises(ReservationConflictError):
        asyncio.run(scenario())


def test_service_allows_adjacent_reservation():
    service, collection = _make_reservation_service()

    async def scenario():
        await service.create(_payload())
        return await service.create(
            _payload(
                event_name="Adjacent",
                setup_start_time="12:00",
                start_time="12:30",
                end_time="14:00",
            )
        )

    result = asyncio.run(scenario())
    assert result["status"] == "pending"
    assert len(collection.documents) == 2


def test_room_dao_get_by_room_id():
    collection = MockRoomsCollection(seed=SEED_ROOMS)
    service = RoomService(RoomDAO(SimpleNamespace(rooms=collection)))

    room = asyncio.run(service.get_by_room_id("seminarraum-2-112"))
    assert room is not None
    assert room["capacity"] == 50
    assert room["area_m2"] == 108

    missing = asyncio.run(service.get_by_room_id("unknown-room"))
    assert missing is None

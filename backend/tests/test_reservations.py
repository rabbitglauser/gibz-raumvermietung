import sys
from types import ModuleType, SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

# Stub app.db before any router import. conftest.py also does this; we
# guard here so this module is safe to run in isolation as well.
fake_db_module = ModuleType("app.db")
fake_db_module.db = SimpleNamespace()
fake_db_module.ping_db = AsyncMock(return_value=True)
fake_db_module.get_database = lambda: fake_db_module.db
sys.modules.setdefault("app.db", fake_db_module)

from app.db import get_database  # noqa: E402
from app.routers.reservations import router as reservations_router  # noqa: E402
from app.security import get_current_user  # noqa: E402

from .mocks import MockReservationsCollection  # noqa: E402

app = FastAPI()
app.include_router(reservations_router)


@pytest.fixture
def mock_collection() -> MockReservationsCollection:
    return MockReservationsCollection()


@pytest.fixture
def client(mock_collection):
    fake_db = SimpleNamespace(reservations=mock_collection)
    app.dependency_overrides[get_database] = lambda: fake_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


@pytest.fixture
def staff_client(mock_collection):
    """Client with the staff-auth dependency stubbed out, for management
    endpoints (list/get/patch). Auth itself is covered in test_staff_routes."""
    fake_db = SimpleNamespace(reservations=mock_collection)
    app.dependency_overrides[get_database] = lambda: fake_db
    app.dependency_overrides[get_current_user] = lambda: {
        "_id": "user-1",
        "username": "tester",
        "role": "admin",
    }
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


def valid_payload() -> dict:
    return {
        "event_name": "M165 Project Presentation",
        "date": "2026-06-15",
        "setup_start_time": "08:30",
        "start_time": "09:00",
        "end_time": "12:00",
        "room": "aula-1-005",
        "attendee_count": 120,
        "organizer_type": "gibz_internal_school_event",
        "contact": {
            "name": "Test User",
            "email": "test@example.com",
            "phone": "+41 41 123 45 67",
            "department": "Informatik",
        },
        "billing_address": {
            "name": "GIBZ Test Company",
            "street": "Industriestrasse 52",
            "postal_code_city": "6300 Zug",
            "invoice_note": "Use project cost center",
        },
        "catering": {
            "needed": True,
            "before_event": {
                "enabled": True,
                "from_time": "08:30",
                "to_time": "09:00",
            },
            "during_event": {
                "enabled": False,
                "from_time": None,
                "to_time": None,
            },
            "after_event": {
                "enabled": False,
                "from_time": None,
                "to_time": None,
            },
        },
        "setup": {
            "seating_type": "theater",
            "equipment": [
                {"type": "projector", "quantity": 1},
                {"type": "lectern", "quantity": 1},
            ],
            "microphone_needed": True,
            "technical_support_hours": 1.5,
            "regie_hours": 1.0,
        },
        "publication": {
            "info_screen_text": "M165 Project Presentation",
            "publish_on_info_screen": True,
            "publish_target_groups": ["students", "teachers"],
        },
        "remarks": "Please open the room 30 minutes early.",
        "terms_accepted": True,
    }


def test_create_reservation_returns_confirmation(client, mock_collection):
    response = client.post("/reservations", json=valid_payload())

    assert response.status_code == 201
    body = response.json()
    assert body["id"] == "reservation-1"
    assert body["status"] == "pending"
    assert body["event_name"] == "M165 Project Presentation"
    assert body["room"] == "aula-1-005"
    assert body["contact"]["email"] == "test@example.com"
    assert body["attendee_count"] == 120
    assert body["organizer_type"] == "gibz_internal_school_event"
    assert body["terms_accepted"] is True
    assert body["created_at"]
    assert body["updated_at"]

    saved = mock_collection.documents[0]
    assert saved["status"] == "pending"
    assert saved["contact"]["name"] == "Test User"
    assert saved["created_at"] == saved["updated_at"]
    mock_collection.insert_one.assert_awaited_once()


def test_post_reservations_accepts_valid_reservation_data(client):
    response = client.post("/reservations", json=valid_payload())

    assert response.status_code == 201
    assert response.json()["status"] == "pending"


def test_post_reservations_rejects_missing_required_field(client):
    payload = valid_payload()
    del payload["event_name"]

    response = client.post("/reservations", json=payload)

    assert response.status_code == 422
    assert response.json()["detail"]


def test_post_reservations_rejects_invalid_email_data(client):
    payload = valid_payload()
    payload["contact"]["email"] = "not-an-email"

    response = client.post("/reservations", json=payload)

    assert response.status_code == 422
    assert response.json()["detail"]


def test_post_reservations_rejects_empty_room(client):
    payload = valid_payload()
    payload["room"] = ""

    response = client.post("/reservations", json=payload)

    assert response.status_code == 422
    assert response.json()["detail"]


@pytest.mark.parametrize(
    "field,value",
    [
        ("room", "unknown-room"),
        ("attendee_count", 0),
        ("organizer_type", "partner"),
        ("terms_accepted", False),
    ],
)
def test_create_reservation_rejects_invalid_top_level_fields(client, field, value):
    payload = valid_payload()
    payload[field] = value

    response = client.post("/reservations", json=payload)

    assert response.status_code == 422
    assert response.json()["detail"]


@pytest.mark.parametrize(
    "setup_start_time,start_time,end_time",
    [
        ("09:30", "09:00", "12:00"),
        ("08:30", "12:00", "12:00"),
        ("08:30", "12:30", "12:00"),
    ],
)
def test_create_reservation_rejects_invalid_time_order(
    client,
    setup_start_time,
    start_time,
    end_time,
):
    payload = valid_payload()
    payload["setup_start_time"] = setup_start_time
    payload["start_time"] = start_time
    payload["end_time"] = end_time

    response = client.post("/reservations", json=payload)

    assert response.status_code == 422
    assert response.json()["detail"]


def test_create_reservation_rejects_overlapping_same_room_date_time(client):
    first_response = client.post("/reservations", json=valid_payload())
    assert first_response.status_code == 201

    overlapping_payload = valid_payload()
    overlapping_payload["event_name"] = "Overlapping Event"
    overlapping_payload["setup_start_time"] = "10:00"
    overlapping_payload["start_time"] = "10:30"
    overlapping_payload["end_time"] = "13:00"

    response = client.post("/reservations", json=overlapping_payload)

    assert response.status_code == 409
    assert "already reserved" in response.json()["detail"]


def test_create_reservation_allows_adjacent_same_room_booking(client):
    first_response = client.post("/reservations", json=valid_payload())
    assert first_response.status_code == 201

    adjacent_payload = valid_payload()
    adjacent_payload["event_name"] = "Adjacent Event"
    adjacent_payload["setup_start_time"] = "12:00"
    adjacent_payload["start_time"] = "12:30"
    adjacent_payload["end_time"] = "14:00"

    response = client.post("/reservations", json=adjacent_payload)

    assert response.status_code == 201


def test_list_reservations_requires_staff(client):
    """Anonymous access to the management list is rejected."""
    response = client.get("/reservations")
    assert response.status_code == 401


def test_list_reservations_returns_typed_items(staff_client):
    first_payload = valid_payload()
    second_payload = valid_payload()
    second_payload["event_name"] = "Second Presentation"
    second_payload["setup_start_time"] = "12:00"
    second_payload["start_time"] = "12:30"
    second_payload["end_time"] = "14:00"

    assert staff_client.post("/reservations", json=first_payload).status_code == 201
    assert staff_client.post("/reservations", json=second_payload).status_code == 201

    response = staff_client.get("/reservations")

    assert response.status_code == 200
    body = response.json()
    assert list(body.keys()) == ["items"]
    assert len(body["items"]) == 2
    assert body["items"][0]["id"]
    assert body["items"][0]["status"] == "pending"
    assert body["items"][0]["contact"]["email"]


def test_create_returns_edit_token(client):
    response = client.post("/reservations", json=valid_payload())
    assert response.status_code == 201
    token = response.json()["edit_token"]
    assert token and len(token) >= 20


def test_list_filters_by_catering(staff_client):
    with_catering = valid_payload()
    without_catering = valid_payload()
    without_catering["event_name"] = "No Catering"
    without_catering["setup_start_time"] = "13:00"
    without_catering["start_time"] = "13:30"
    without_catering["end_time"] = "15:00"
    without_catering["catering"] = {
        "needed": False,
        "before_event": {"enabled": False, "from_time": None, "to_time": None},
        "during_event": {"enabled": False, "from_time": None, "to_time": None},
        "after_event": {"enabled": False, "from_time": None, "to_time": None},
    }

    assert staff_client.post("/reservations", json=with_catering).status_code == 201
    assert staff_client.post("/reservations", json=without_catering).status_code == 201

    response = staff_client.get("/reservations", params={"has_catering": "true"})
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 1
    assert items[0]["catering"]["needed"] is True


def test_list_search_by_name(staff_client):
    assert staff_client.post("/reservations", json=valid_payload()).status_code == 201

    hit = staff_client.get("/reservations", params={"q": "M165"})
    miss = staff_client.get("/reservations", params={"q": "nonexistent-event"})

    assert len(hit.json()["items"]) == 1
    assert len(miss.json()["items"]) == 0


def test_availability_is_public_and_hides_pii(client):
    assert client.post("/reservations", json=valid_payload()).status_code == 201

    response = client.get("/reservations/availability", params={"room": "aula-1-005"})
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 1
    assert set(items[0].keys()) == {"room", "date", "setup_start_time", "end_time"}


def test_staff_can_update_status_and_delete(staff_client):
    created = staff_client.post("/reservations", json=valid_payload()).json()
    rid = created["id"]

    patched = staff_client.patch(f"/reservations/{rid}", json={"status": "confirmed"})
    assert patched.status_code == 200
    assert patched.json()["status"] == "confirmed"

    deleted = staff_client.delete(f"/reservations/{rid}")
    assert deleted.status_code == 204

    assert staff_client.get(f"/reservations/{rid}").status_code == 404


def test_room_specific_capacity_validation(client):
    payload = valid_payload()
    payload["room"] = "seminarraum-2-112"
    payload["attendee_count"] = 51
    payload["setup"]["seating_type"] = "seminar"
    payload["setup"]["equipment"] = [{"type": "projector", "quantity": 1}]
    payload["setup"]["microphone_needed"] = False
    payload["setup"]["technical_support_hours"] = None
    payload["setup"]["regie_hours"] = None

    response = client.post("/reservations", json=payload)

    assert response.status_code == 422
    assert response.json()["detail"]


def test_room_specific_equipment_validation(client):
    payload = valid_payload()
    payload["room"] = "seminarraum-5-003-004"
    payload["attendee_count"] = 20
    payload["setup"]["seating_type"] = "seminar"
    payload["setup"]["equipment"] = [{"type": "stage", "quantity": 1}]
    payload["setup"]["microphone_needed"] = False
    payload["setup"]["technical_support_hours"] = None
    payload["setup"]["regie_hours"] = None

    response = client.post("/reservations", json=payload)

    assert response.status_code == 422
    assert response.json()["detail"]

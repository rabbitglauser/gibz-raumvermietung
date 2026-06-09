"""Staff-protected route tests.

Uses the same TestClient + MockReservationsCollection pattern as
test_reservations.py. The require_staff dependency is exercised directly
— no monkeypatching of the token — so auth behaviour is covered end-to-end.
"""

import sys
from types import ModuleType, SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

fake_db_module = ModuleType("app.db")
fake_db_module.db = SimpleNamespace()
fake_db_module.ping_db = AsyncMock(return_value=True)
fake_db_module.get_database = lambda: fake_db_module.db
sys.modules.setdefault("app.db", fake_db_module)

from app.config import settings  # noqa: E402
from app.db import get_database  # noqa: E402
from app.routers.staff import router as staff_router  # noqa: E402

from .mocks import MockReservationsCollection  # noqa: E402

TEST_TOKEN = "test-staff-secret"

app = FastAPI()
app.include_router(staff_router)


@pytest.fixture(autouse=True)
def patch_token(monkeypatch):
    monkeypatch.setattr(settings, "staff_secret_token", TEST_TOKEN)


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


def auth_headers() -> dict:
    return {"Authorization": f"Bearer {TEST_TOKEN}"}


def seed_reservation(client: TestClient) -> str:
    """Create one reservation via the public endpoint and return its id."""
    from app.routers.reservations import router as reservations_router

    seed_app = FastAPI()
    seed_app.include_router(reservations_router)

    fake_db = client.app.dependency_overrides[get_database]()
    seed_app.dependency_overrides[get_database] = lambda: fake_db
    seed_client = TestClient(seed_app)

    payload = {
        "event_name": "Staff Test Event",
        "date": "2026-12-01",
        "setup_start_time": "08:30",
        "start_time": "09:00",
        "end_time": "12:00",
        "room": "aula-1-005",
        "attendee_count": 50,
        "organizer_type": "gibz_internal_school_event",
        "contact": {
            "name": "Staff Tester",
            "email": "staff@gibz.ch",
            "phone": "+41 41 000 00 00",
        },
        "billing_address": {
            "name": "GIBZ",
            "street": "Industriestrasse 52",
            "postal_code_city": "6300 Zug",
        },
        "catering": {
            "needed": False,
            "before_event": {"enabled": False},
            "during_event": {"enabled": False},
            "after_event": {"enabled": False},
        },
        "setup": {
            "seating_type": "theater",
            "equipment": [],
            "microphone_needed": True,
        },
        "publication": {
            "publish_on_info_screen": False,
            "publish_target_groups": [],
        },
        "terms_accepted": True,
    }
    resp = seed_client.post("/reservations", json=payload)
    assert resp.status_code == 201
    return resp.json()["id"]


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------


def test_request_without_token_returns_401(client):
    response = client.get("/staff/reservations")
    assert response.status_code == 401


def test_request_with_wrong_token_returns_401(client):
    response = client.get(
        "/staff/reservations",
        headers={"Authorization": "Bearer wrong-token"},
    )
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# GET /staff/reservations
# ---------------------------------------------------------------------------


def test_list_reservations_returns_empty_list_when_no_reservations(client):
    response = client.get("/staff/reservations", headers=auth_headers())
    assert response.status_code == 200
    assert response.json() == {"items": []}


def test_list_reservations_returns_created_reservation(client):
    rid = seed_reservation(client)
    response = client.get("/staff/reservations", headers=auth_headers())
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 1
    assert items[0]["id"] == rid
    assert items[0]["status"] == "pending"


def test_list_reservations_filters_by_status(client):
    seed_reservation(client)
    response = client.get(
        "/staff/reservations?status=confirmed", headers=auth_headers()
    )
    assert response.status_code == 200
    assert response.json()["items"] == []


def test_list_reservations_filters_upcoming(client):
    seed_reservation(client)
    response = client.get(
        "/staff/reservations?upcoming=true", headers=auth_headers()
    )
    assert response.status_code == 200
    # date is 2026-12-01 which is in the future relative to test run date
    assert len(response.json()["items"]) == 1


def test_list_reservations_filters_past(client):
    seed_reservation(client)
    response = client.get(
        "/staff/reservations?upcoming=false", headers=auth_headers()
    )
    assert response.status_code == 200
    # 2026-12-01 is upcoming, so past filter yields nothing
    assert response.json()["items"] == []


# ---------------------------------------------------------------------------
# GET /staff/reservations/{id}
# ---------------------------------------------------------------------------


def test_get_reservation_returns_correct_document(client):
    rid = seed_reservation(client)
    response = client.get(f"/staff/reservations/{rid}", headers=auth_headers())
    assert response.status_code == 200
    assert response.json()["id"] == rid
    assert response.json()["event_name"] == "Staff Test Event"


def test_get_reservation_returns_404_for_unknown_id(client):
    response = client.get("/staff/reservations/does-not-exist", headers=auth_headers())
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# PATCH /staff/reservations/{id}/status
# ---------------------------------------------------------------------------


def test_patch_status_transitions_pending_to_confirmed(client):
    rid = seed_reservation(client)
    response = client.patch(
        f"/staff/reservations/{rid}/status?new_status=confirmed",
        headers=auth_headers(),
    )
    assert response.status_code == 200
    assert response.json()["status"] == "confirmed"


def test_patch_status_transitions_pending_to_rejected(client):
    rid = seed_reservation(client)
    response = client.patch(
        f"/staff/reservations/{rid}/status?new_status=rejected",
        headers=auth_headers(),
    )
    assert response.status_code == 200
    assert response.json()["status"] == "rejected"


def test_patch_status_returns_404_for_unknown_id(client):
    response = client.patch(
        "/staff/reservations/does-not-exist/status?new_status=confirmed",
        headers=auth_headers(),
    )
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# DELETE /staff/reservations/{id}
# ---------------------------------------------------------------------------


def test_delete_reservation_returns_204(client):
    rid = seed_reservation(client)
    response = client.delete(f"/staff/reservations/{rid}", headers=auth_headers())
    assert response.status_code == 204


def test_delete_reservation_removes_document(client):
    rid = seed_reservation(client)
    client.delete(f"/staff/reservations/{rid}", headers=auth_headers())
    get_response = client.get(f"/staff/reservations/{rid}", headers=auth_headers())
    assert get_response.status_code == 404


def test_delete_reservation_returns_404_for_unknown_id(client):
    response = client.delete(
        "/staff/reservations/does-not-exist", headers=auth_headers()
    )
    assert response.status_code == 404

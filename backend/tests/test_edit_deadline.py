"""Edit deadline tests for PUT /reservations/edit/{token}."""

import sys
from datetime import datetime, timezone
from types import ModuleType, SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

fake_db_module = ModuleType("app.db")
fake_db_module.db = SimpleNamespace()
fake_db_module.ping_db = AsyncMock(return_value=True)
fake_db_module.get_database = lambda: fake_db_module.db
sys.modules.setdefault("app.db", fake_db_module)

from app.db import get_database  # noqa: E402
from app.routers.reservations import router as reservations_router  # noqa: E402

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


def valid_payload() -> dict:
    return {
        "event_name": "Edit Deadline Test",
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
            "invoice_note": None,
        },
        "catering": {
            "needed": False,
            "before_event": {"enabled": False, "from_time": None, "to_time": None},
            "during_event": {"enabled": False, "from_time": None, "to_time": None},
            "after_event": {"enabled": False, "from_time": None, "to_time": None},
        },
        "setup": {
            "seating_type": "theater",
            "equipment": [{"type": "projector", "quantity": 1}],
            "microphone_needed": True,
            "technical_support_hours": None,
            "regie_hours": None,
        },
        "publication": {
            "info_screen_text": None,
            "publish_on_info_screen": False,
            "publish_target_groups": [],
        },
        "remarks": None,
        "terms_accepted": True,
    }


def _create_and_get_token(client) -> str:
    resp = client.post("/reservations", json=valid_payload())
    assert resp.status_code == 201
    token = resp.json().get("edit_token")
    assert token is not None
    return token


def test_create_reservation_returns_edit_token(client):
    resp = client.post("/reservations", json=valid_payload())
    assert resp.status_code == 201
    body = resp.json()
    assert "edit_token" in body
    assert body["edit_token"] is not None
    assert len(body["edit_token"]) == 36  # UUID length


def test_get_reservation_by_edit_token(client):
    token = _create_and_get_token(client)
    resp = client.get(f"/reservations/edit/{token}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["event_name"] == "Edit Deadline Test"
    assert body["edit_token"] == token


def test_get_reservation_by_invalid_token_returns_404(client):
    resp = client.get("/reservations/edit/nonexistent-token")
    assert resp.status_code == 404


def test_edit_before_deadline_succeeds(client):
    """Editing a reservation before the deadline cutoff should return 200."""
    token = _create_and_get_token(client)

    # Mock current time to well before the event (2026-06-15 09:00 UTC - 48h)
    before_deadline = datetime(2026, 6, 13, 9, 0, 0, tzinfo=timezone.utc)
    updated_payload = valid_payload()
    updated_payload["event_name"] = "Updated Event Name"

    with patch("app.services.reservation_service.datetime") as mock_dt:
        mock_dt.now.return_value = before_deadline
        mock_dt.combine = datetime.combine
        resp = client.put(f"/reservations/edit/{token}", json=updated_payload)

    assert resp.status_code == 200
    assert resp.json()["event_name"] == "Updated Event Name"


def test_edit_after_deadline_is_rejected(client):
    """Editing a reservation past the deadline should return 403."""
    token = _create_and_get_token(client)

    # Mock current time to after the deadline (within 24h of event start)
    after_deadline = datetime(2026, 6, 14, 10, 0, 0, tzinfo=timezone.utc)
    updated_payload = valid_payload()
    updated_payload["event_name"] = "Should Not Update"

    with patch("app.services.reservation_service.datetime") as mock_dt:
        mock_dt.now.return_value = after_deadline
        mock_dt.combine = datetime.combine
        resp = client.put(f"/reservations/edit/{token}", json=updated_payload)

    assert resp.status_code == 403
    assert "deadline" in resp.json()["detail"].lower() or "longer" in resp.json()["detail"].lower()


def test_edit_deadline_uses_event_start_time(client):
    """The deadline must be computed from the reservation's start_time, not now."""
    token = _create_and_get_token(client)

    updated_payload = valid_payload()
    updated_payload["event_name"] = "Time-based Deadline Test"

    # Exactly at the deadline boundary: event starts 2026-06-15 09:00 UTC,
    # deadline is 24h before = 2026-06-14 09:00 UTC.
    # One second before deadline should succeed.
    just_before_deadline = datetime(2026, 6, 14, 8, 59, 59, tzinfo=timezone.utc)
    with patch("app.services.reservation_service.datetime") as mock_dt:
        mock_dt.now.return_value = just_before_deadline
        mock_dt.combine = datetime.combine
        resp = client.put(f"/reservations/edit/{token}", json=updated_payload)
    assert resp.status_code == 200

    # Exactly at deadline should be rejected.
    at_deadline = datetime(2026, 6, 14, 9, 0, 0, tzinfo=timezone.utc)
    with patch("app.services.reservation_service.datetime") as mock_dt:
        mock_dt.now.return_value = at_deadline
        mock_dt.combine = datetime.combine
        resp = client.put(f"/reservations/edit/{token}", json=updated_payload)
    assert resp.status_code == 403


def test_edit_with_unknown_token_returns_404(client):
    resp = client.put("/reservations/edit/no-such-token", json=valid_payload())
    assert resp.status_code == 404


def test_edit_does_not_allow_conflicting_room_time(client):
    """Updating to a time that conflicts with another reservation returns 409."""
    token = _create_and_get_token(client)

    # Create a second reservation in a different time slot
    second_payload = valid_payload()
    second_payload["event_name"] = "Second Event"
    second_payload["setup_start_time"] = "13:00"
    second_payload["start_time"] = "13:30"
    second_payload["end_time"] = "15:00"
    client.post("/reservations", json=second_payload)

    # Try to update first reservation to overlap with second
    before_deadline = datetime(2026, 6, 13, 9, 0, 0, tzinfo=timezone.utc)
    conflicting_payload = valid_payload()
    conflicting_payload["setup_start_time"] = "13:00"
    conflicting_payload["start_time"] = "13:30"
    conflicting_payload["end_time"] = "15:00"

    with patch("app.services.reservation_service.datetime") as mock_dt:
        mock_dt.now.return_value = before_deadline
        mock_dt.combine = datetime.combine
        resp = client.put(f"/reservations/edit/{token}", json=conflicting_payload)

    assert resp.status_code == 409


def test_edit_updates_catering_fields(client):
    """Updating catering fields via PUT /reservations/edit/{token} persists changes."""
    token = _create_and_get_token(client)

    updated = valid_payload()
    updated["catering"] = {
        "needed": True,
        "before_event": {"enabled": True, "from_time": "08:00", "to_time": "09:00"},
        "during_event": {"enabled": False, "from_time": None, "to_time": None},
        "after_event": {"enabled": False, "from_time": None, "to_time": None},
    }

    before_deadline = datetime(2026, 6, 13, 9, 0, 0, tzinfo=timezone.utc)
    with patch("app.services.reservation_service.datetime") as mock_dt:
        mock_dt.now.return_value = before_deadline
        mock_dt.combine = datetime.combine
        resp = client.put(f"/reservations/edit/{token}", json=updated)

    assert resp.status_code == 200
    body = resp.json()
    assert body["catering"]["needed"] is True
    assert body["catering"]["before_event"]["enabled"] is True
    assert body["catering"]["during_event"]["enabled"] is False


def test_edit_rejects_catering_needed_without_active_window(client):
    """Catering needed=True with no enabled windows should return 422."""
    token = _create_and_get_token(client)

    updated = valid_payload()
    updated["catering"] = {
        "needed": True,
        "before_event": {"enabled": False, "from_time": None, "to_time": None},
        "during_event": {"enabled": False, "from_time": None, "to_time": None},
        "after_event": {"enabled": False, "from_time": None, "to_time": None},
    }

    before_deadline = datetime(2026, 6, 13, 9, 0, 0, tzinfo=timezone.utc)
    with patch("app.services.reservation_service.datetime") as mock_dt:
        mock_dt.now.return_value = before_deadline
        mock_dt.combine = datetime.combine
        resp = client.put(f"/reservations/edit/{token}", json=updated)

    assert resp.status_code == 422


def test_edit_updates_setup_fields(client):
    """Updating setup (seating, equipment, microphone) via edit endpoint persists changes."""
    token = _create_and_get_token(client)

    updated = valid_payload()
    updated["setup"] = {
        "seating_type": "seminar",
        "equipment": [{"type": "projector", "quantity": 2}, {"type": "flipchart", "quantity": 1}],
        "microphone_needed": False,
        "technical_support_hours": None,
        "regie_hours": None,
    }

    before_deadline = datetime(2026, 6, 13, 9, 0, 0, tzinfo=timezone.utc)
    with patch("app.services.reservation_service.datetime") as mock_dt:
        mock_dt.now.return_value = before_deadline
        mock_dt.combine = datetime.combine
        resp = client.put(f"/reservations/edit/{token}", json=updated)

    assert resp.status_code == 200
    body = resp.json()
    assert body["setup"]["seating_type"] == "seminar"
    assert body["setup"]["microphone_needed"] is False
    equipment_types = {e["type"] for e in body["setup"]["equipment"]}
    assert "projector" in equipment_types
    assert "flipchart" in equipment_types

"""Edit deadline tests.

Customers may edit a reservation via its edit token until
``edit_deadline_days`` before the event date. After that the API returns
403. The deadline is computed from the reservation's event date, not from
"now plus an offset".
"""

import sys
from datetime import date, timedelta
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


def _payload(event_date: date) -> dict:
    return {
        "event_name": "Editable Event",
        "date": event_date.isoformat(),
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


def _create(client, event_date: date) -> str:
    response = client.post("/reservations", json=_payload(event_date))
    assert response.status_code == 201
    return response.json()["edit_token"]


def test_edit_before_deadline_succeeds(client):
    far_future = date.today() + timedelta(days=settings.edit_deadline_days + 30)
    token = _create(client, far_future)

    response = client.patch(
        f"/reservations/edit/{token}",
        json={"remarks": "Please unlock the room 30 minutes early."},
    )

    assert response.status_code == 200
    assert response.json()["remarks"] == "Please unlock the room 30 minutes early."


def test_edit_after_deadline_is_rejected(client):
    # Event is tomorrow, deadline is edit_deadline_days before → already past.
    tomorrow = date.today() + timedelta(days=1)
    token = _create(client, tomorrow)

    response = client.patch(
        f"/reservations/edit/{token}",
        json={"remarks": "Too late"},
    )

    assert response.status_code == 403
    assert "deadline" in response.json()["detail"].lower()


def test_edit_deadline_uses_event_start_date(client):
    # Exactly on the last editable day (event_date - edit_deadline_days == today).
    boundary = date.today() + timedelta(days=settings.edit_deadline_days)
    token = _create(client, boundary)

    response = client.patch(
        f"/reservations/edit/{token}",
        json={"remarks": "Right on the boundary"},
    )

    assert response.status_code == 200


def test_edit_unknown_token_returns_404(client):
    response = client.patch(
        "/reservations/edit/does-not-exist",
        json={"remarks": "x"},
    )
    assert response.status_code == 404

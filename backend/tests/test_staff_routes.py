from types import SimpleNamespace

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.config import settings
from app.db import get_database
from app.routers.reservations import router as reservations_router
from app.services.auth_service import create_auth_token

from .mocks import MockReservationsCollection

app = FastAPI()
app.include_router(reservations_router)


@pytest.fixture
def mock_collection() -> MockReservationsCollection:
    return MockReservationsCollection()


@pytest.fixture
def client(mock_collection):
    app.dependency_overrides[get_database] = lambda: SimpleNamespace(
        reservations=mock_collection
    )
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


def valid_payload() -> dict:
    return {
        "event_name": "Staff Route Test",
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
        },
        "billing_address": {
            "name": "GIBZ Test Company",
            "street": "Industriestrasse 52",
            "postal_code_city": "6300 Zug",
        },
        "catering": {"needed": False},
        "setup": {
            "seating_type": "theater",
            "equipment": [{"type": "projector", "quantity": 1}],
            "microphone_needed": True,
        },
        "terms_accepted": True,
    }


def create_reservation(client) -> str:
    response = client.post("/reservations", json=valid_payload())
    assert response.status_code == 201
    return response.json()["id"]


def set_staff_cookie(client, role: str = "staff") -> None:
    token = create_auth_token("staff-user", role)
    client.cookies.set(settings.auth_cookie_name, token)


def test_unauthenticated_request_to_staff_route_is_rejected(client):
    reservation_id = create_reservation(client)

    response = client.patch(
        f"/reservations/{reservation_id}/status",
        json={"status": "confirmed"},
    )

    assert response.status_code == 401


def test_non_staff_token_is_rejected(client):
    reservation_id = create_reservation(client)
    set_staff_cookie(client, role="student")

    response = client.patch(
        f"/reservations/{reservation_id}/status",
        json={"status": "confirmed"},
    )

    assert response.status_code == 403


def test_staff_token_can_confirm_reservation(client):
    reservation_id = create_reservation(client)
    set_staff_cookie(client)

    response = client.patch(
        f"/reservations/{reservation_id}/status",
        json={"status": "confirmed"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "confirmed"


def test_staff_token_can_reject_reservation(client):
    reservation_id = create_reservation(client)
    set_staff_cookie(client)

    response = client.patch(
        f"/reservations/{reservation_id}/status",
        json={"status": "rejected"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "rejected"


def test_staff_token_can_cancel_reservation(client):
    reservation_id = create_reservation(client)
    set_staff_cookie(client)

    response = client.delete(f"/reservations/{reservation_id}")

    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"

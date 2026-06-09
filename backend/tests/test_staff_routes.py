from types import SimpleNamespace

import sys
from types import ModuleType, SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from bson import ObjectId
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.config import settings
from app.db import get_database
from app.routers.reservations import router as reservations_router
from app.services.auth_service import create_auth_token

from .mocks import MockReservationsCollection


class ObjectIdReservationsCollection(MockReservationsCollection):
    """Mirrors production: MongoDB assigns ObjectId `_id`s, which the API exposes
    as 24-char hex strings. The default mock uses string `_id`s, so it cannot catch
    the ObjectId-vs-string lookup mismatch that broke the staff actions."""

    def _insert_one(self, doc: dict) -> SimpleNamespace:
        inserted_id = ObjectId()
        self.documents.append({**doc, "_id": inserted_id})
        return SimpleNamespace(inserted_id=inserted_id)

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


def test_secretariat_token_can_confirm_reservation(client):
    reservation_id = create_reservation(client)
    set_staff_cookie(client, role="secretariat")
    response = client.patch(
        f"/reservations/{reservation_id}/status",
        json={"status": "confirmed"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "confirmed"


def test_hausdienst_token_can_cancel_reservation(client):
    reservation_id = create_reservation(client)
    set_staff_cookie(client, role="hausdienst")
    response = client.delete(f"/reservations/{reservation_id}")
    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"


@pytest.fixture
def objectid_client():
    """Client backed by a collection that uses real ObjectId `_id`s, matching prod."""
    collection = ObjectIdReservationsCollection()
    app.dependency_overrides[get_database] = lambda: SimpleNamespace(
        reservations=collection
    )
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


def test_staff_can_confirm_reservation_with_objectid_id(objectid_client):
    """Regression: hex-string ids from ObjectId-backed docs must resolve.

    Before the DAO coerced the incoming id back to an ObjectId, this returned
    404 "Reservation not found" because a hex string never matches an ObjectId.
    """
    reservation_id = create_reservation(objectid_client)
    assert len(reservation_id) == 24  # ObjectId hex form, not "reservation-N"
    set_staff_cookie(objectid_client)

    response = objectid_client.patch(
        f"/reservations/{reservation_id}/status",
        json={"status": "confirmed"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "confirmed"


def test_staff_can_cancel_reservation_with_objectid_id(objectid_client):
    reservation_id = create_reservation(objectid_client)
    set_staff_cookie(objectid_client)

    response = objectid_client.delete(f"/reservations/{reservation_id}")

    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"

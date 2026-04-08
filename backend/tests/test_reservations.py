import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.main import app  # noqa: E402
from app.routers import reservations  # noqa: E402


class InsertOneResult:
    def __init__(self, inserted_id: str):
        self.inserted_id = inserted_id


class FakeReservationsCollection:
    def __init__(self):
        self.documents = []
        self.next_id = 1

    async def insert_one(self, doc: dict) -> InsertOneResult:
        inserted_id = f"reservation-{self.next_id}"
        self.next_id += 1
        saved = {**doc, "_id": inserted_id}
        self.documents.append(saved)
        return InsertOneResult(inserted_id)

    async def find_one(self, query: dict) -> dict | None:
        return next(
            (doc for doc in self.documents if doc["_id"] == query.get("_id")),
            None,
        )


class FakeDb:
    def __init__(self):
        self.reservations = FakeReservationsCollection()


@pytest.fixture
def fake_db(monkeypatch):
    db = FakeDb()
    monkeypatch.setattr(reservations, "db", db)
    return db


@pytest.fixture
def client(fake_db):
    return TestClient(app)


def valid_payload() -> dict:
    return {
        "event_name": "M165 Project Presentation",
        "date": "2026-06-15",
        "setup_start_time": "08:30",
        "start_time": "09:00",
        "end_time": "12:00",
        "room": "Aula 1.005",
        "contact_name": "Test User",
        "email": "test@example.com",
        "phone": "+41 41 123 45 67",
        "attendee_count": 42,
        "billing_name": "GIBZ Test Company",
        "billing_address": "Industriestrasse 52",
        "billing_postal_code_city": "6300 Zug",
        "organizer_type": "external",
        "terms_accepted": True,
        "department": "Informatik",
        "invoice_note": "Use project cost center",
        "catering_needed": True,
        "catering_time_slots": ["10:00 coffee", "11:30 lunch"],
        "seating_type": "theater",
        "additional_equipment": ["projector", "flipchart"],
        "microphone_needed": True,
        "technical_support_regie_hours": 1.5,
        "info_screen_text": "M165 Project Presentation",
        "remarks": "Please open the room 30 minutes early.",
        "publication_settings": ["internal screen"],
        "target_groups": ["students", "teachers"],
    }


def test_create_reservation_returns_confirmation(client, fake_db):
    response = client.post("/reservations", json=valid_payload())

    assert response.status_code == 201
    body = response.json()
    assert body["id"] == "reservation-1"
    assert body["status"] == "pending"
    assert body["event_name"] == "M165 Project Presentation"
    assert body["room"] == "Aula 1.005"
    assert body["email"] == "test@example.com"
    assert body["attendee_count"] == 42
    assert body["organizer_type"] == "external"
    assert body["terms_accepted"] is True
    assert body["created_at"]
    assert body["updated_at"]

    saved = fake_db.reservations.documents[0]
    assert saved["status"] == "pending"
    assert saved["event_name"] == "M165 Project Presentation"
    assert saved["created_at"] == saved["updated_at"]


def test_post_reservations_accepts_valid_reservation_data(client):
    response = client.post("/reservations", json=valid_payload())

    assert response.status_code == 201
    assert response.json()["status"] == "pending"


def test_post_reservations_rejects_invalid_email_data(client):
    payload = valid_payload()
    payload["email"] = "not-an-email"

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
        ("email", "not-an-email"),
        ("attendee_count", 0),
        ("organizer_type", "partner"),
        ("terms_accepted", False),
    ],
)
def test_create_reservation_rejects_invalid_fields(client, field, value):
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

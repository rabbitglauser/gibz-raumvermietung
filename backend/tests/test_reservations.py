import sys
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


async def fake_ping_db() -> bool:
    return True


sys.modules.setdefault(
    "app.db",
    SimpleNamespace(db=SimpleNamespace(), ping_db=fake_ping_db),
)

from app.main import app
from app.routers import reservations


class InsertOneResult:
    def __init__(self, inserted_id: str):
        self.inserted_id = inserted_id


class FakeCursor:
    def __init__(self, documents: list[dict]):
        self.documents = documents

    def sort(self, field: str, direction: int) -> "FakeCursor":
        reverse = direction < 0
        self.documents = sorted(
            self.documents,
            key=lambda item: item[field],
            reverse=reverse,
        )
        return self

    def __aiter__(self):
        self._iter = iter(self.documents)
        return self

    async def __anext__(self):
        try:
            return next(self._iter)
        except StopIteration as exc:
            raise StopAsyncIteration from exc


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
        if "_id" in query:
            return next(
                (doc for doc in self.documents if doc["_id"] == query["_id"]),
                None,
            )

        return next((doc for doc in self.documents if matches_query(doc, query)), None)

    def find(self):
        return FakeCursor(list(self.documents))


def matches_query(doc: dict, query: dict) -> bool:
    for field, expected in query.items():
        actual = doc.get(field)
        if isinstance(expected, dict):
            if "$nin" in expected and actual in expected["$nin"]:
                return False
            if "$lt" in expected and not actual < expected["$lt"]:
                return False
            if "$gt" in expected and not actual > expected["$gt"]:
                return False
            continue
        if actual != expected:
            return False
    return True


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


def test_create_reservation_returns_confirmation(client, fake_db):
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

    saved = fake_db.reservations.documents[0]
    assert saved["status"] == "pending"
    assert saved["contact"]["name"] == "Test User"
    assert saved["created_at"] == saved["updated_at"]


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


def test_list_reservations_returns_typed_items(client):
    first_payload = valid_payload()
    second_payload = valid_payload()
    second_payload["event_name"] = "Second Presentation"
    second_payload["setup_start_time"] = "12:00"
    second_payload["start_time"] = "12:30"
    second_payload["end_time"] = "14:00"

    assert client.post("/reservations", json=first_payload).status_code == 201
    assert client.post("/reservations", json=second_payload).status_code == 201

    response = client.get("/reservations")

    assert response.status_code == 200
    body = response.json()
    assert list(body.keys()) == ["items"]
    assert len(body["items"]) == 2
    assert body["items"][0]["id"]
    assert body["items"][0]["status"] == "pending"
    assert body["items"][0]["contact"]["email"]


def test_room_specific_capacity_validation(client):
    payload = valid_payload()
    payload["room"] = "seminarraum-2-112"
    payload["attendee_count"] = 25
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

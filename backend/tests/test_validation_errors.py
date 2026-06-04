"""Tests for the structured 422 validation error handler."""

from fastapi.testclient import TestClient

from app.db import get_database
from app.main import app

from .mocks import MockReservationsCollection


def _fake_db():
    return type("FakeDB", (), {"reservations": MockReservationsCollection()})()


def _valid_payload() -> dict:
    return {
        "event_name": "Test Event",
        "date": "2026-06-15",
        "setup_start_time": "08:30",
        "start_time": "09:00",
        "end_time": "12:00",
        "room": "aula-1-005",
        "attendee_count": 50,
        "organizer_type": "gibz_internal_school_event",
        "contact": {
            "name": "Test User",
            "email": "test@example.com",
            "phone": "+41 41 123 45 67",
        },
        "billing_address": {
            "name": "Test Org",
            "street": "Teststrasse 1",
            "postal_code_city": "6300 Zug",
        },
        "setup": {"seating_type": "theater"},
        "terms_accepted": True,
    }


def test_validation_error_response_has_structured_detail():
    payload = _valid_payload()
    del payload["event_name"]

    app.dependency_overrides[get_database] = _fake_db
    with TestClient(app) as client:
        try:
            response = client.post("/reservations", json=payload)
        finally:
            app.dependency_overrides.clear()

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert isinstance(detail, list)
    assert len(detail) > 0
    first = detail[0]
    assert "field" in first
    assert "label" in first
    assert "message" in first


def test_validation_error_uses_german_label_for_email():
    payload = _valid_payload()
    payload["contact"]["email"] = "not-an-email"

    app.dependency_overrides[get_database] = _fake_db
    with TestClient(app) as client:
        try:
            response = client.post("/reservations", json=payload)
        finally:
            app.dependency_overrides.clear()

    assert response.status_code == 422
    detail = response.json()["detail"]
    email_error = next((e for e in detail if e["field"] == "contact.email"), None)
    assert email_error is not None
    assert email_error["label"] == "E-Mail"


def test_validation_error_contains_field_path():
    payload = _valid_payload()
    payload["start_time"] = "12:00"
    payload["end_time"] = "09:00"

    app.dependency_overrides[get_database] = _fake_db
    with TestClient(app) as client:
        try:
            response = client.post("/reservations", json=payload)
        finally:
            app.dependency_overrides.clear()

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert isinstance(detail, list)
    assert len(detail) > 0
    for error in detail:
        assert isinstance(error["field"], str)
        assert isinstance(error["message"], str)

import asyncio
from datetime import date, datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.config import settings
from app.db import get_database
from app.routers.reminders import router as reminders_router
from app.services.auth_service import create_auth_token
from app.services.reminder_service import (
    ReminderConfigurationError,
    ReminderService,
    find_missing_details,
)
from app.services import reminder_scheduler
from app.dao.reservation_dao import ReminderLogDAO, ReservationDAO

from .mocks import MockReminderLogCollection, MockReservationsCollection

app = FastAPI()
app.include_router(reminders_router)


def reservation_doc(**overrides) -> dict:
    target_date = (date.today() + timedelta(days=1)).isoformat()
    base = {
        "_id": "reservation-1",
        "event_name": "Reminder Test",
        "date": target_date,
        "setup_start_time": "08:30:00",
        "start_time": "09:00:00",
        "end_time": "12:00:00",
        "room": "aula-1-005",
        "attendee_count": 80,
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
        "catering": {"needed": False},
        "setup": {
            "seating_type": "theater",
            "equipment": [],
            "microphone_needed": False,
        },
        "publication": None,
        "remarks": None,
        "terms_accepted": True,
        "status": "pending",
        "edit_token": "edit-token",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    base.update(overrides)
    return base


def set_staff_cookie(client: TestClient) -> None:
    token = create_auth_token("staff-user", "staff")
    client.cookies.set(settings.auth_cookie_name, token)


def configure_smtp(monkeypatch):
    monkeypatch.setattr(settings, "smtp_host", "smtp.example.com")
    monkeypatch.setattr(settings, "smtp_port", 587)
    monkeypatch.setattr(settings, "smtp_user", None)
    monkeypatch.setattr(settings, "smtp_password", None)
    monkeypatch.setattr(settings, "smtp_from_email", "rooms@example.com")
    monkeypatch.setattr(settings, "smtp_use_tls", False)
    monkeypatch.setattr(settings, "public_frontend_url", "http://localhost:3000")


def test_find_missing_details_detects_setup_and_publication_gaps():
    missing = find_missing_details(reservation_doc())

    assert "Material und Technik" in missing
    assert "Publikation" in missing


def test_reminder_service_sends_and_marks_reservation(monkeypatch):
    configure_smtp(monkeypatch)
    collection = MockReservationsCollection()
    collection.documents.append(reservation_doc())
    log_collection = MockReminderLogCollection()
    sent_messages = []

    def fake_send(message):
        sent_messages.append(message)

    monkeypatch.setattr("app.services.reminder_service._send_email", fake_send)
    database = SimpleNamespace(reservations=collection, reminder_log=log_collection)
    service = ReminderService(ReservationDAO(database), ReminderLogDAO(database))

    result = asyncio.run(service.run())

    assert result.checked == 1
    assert result.sent == 1
    assert sent_messages[0]["To"] == "test@example.com"
    assert collection.documents[0]["reminder_count"] == 1
    assert collection.documents[0]["reminder_sent_at"] is not None
    assert len(log_collection.documents) == 1
    entry = log_collection.documents[0]
    assert entry["status"] == "sent"
    assert entry["reservation_id"] == "reservation-1"
    assert "Material und Technik" in entry["missing_fields"]


def test_reminder_service_logs_error_when_send_fails(monkeypatch):
    configure_smtp(monkeypatch)
    collection = MockReservationsCollection()
    collection.documents.append(reservation_doc())
    log_collection = MockReminderLogCollection()

    def boom(message):
        raise RuntimeError("smtp down")

    monkeypatch.setattr("app.services.reminder_service._send_email", boom)
    database = SimpleNamespace(reservations=collection, reminder_log=log_collection)
    service = ReminderService(ReservationDAO(database), ReminderLogDAO(database))

    result = asyncio.run(service.run())

    assert result.sent == 0
    assert len(result.errors) == 1
    assert collection.documents[0].get("reminder_sent_at") is None
    assert len(log_collection.documents) == 1
    entry = log_collection.documents[0]
    assert entry["status"] == "error"
    assert "smtp down" in entry["error"]


def test_reminder_service_skips_already_sent_reservation(monkeypatch):
    configure_smtp(monkeypatch)
    collection = MockReservationsCollection()
    collection.documents.append(
        reservation_doc(reminder_sent_at=datetime.now(timezone.utc), reminder_count=1)
    )
    log_collection = MockReminderLogCollection()
    monkeypatch.setattr(
        "app.services.reminder_service._send_email",
        lambda message: pytest.fail("must not send"),
    )
    database = SimpleNamespace(reservations=collection, reminder_log=log_collection)
    service = ReminderService(ReservationDAO(database), ReminderLogDAO(database))

    result = asyncio.run(service.run())

    assert result.sent == 0
    assert result.skipped == 1
    assert len(log_collection.documents) == 1
    assert log_collection.documents[0]["status"] == "skipped"
    assert log_collection.documents[0]["error"] == "already_sent"


def test_scheduler_tick_tolerates_missing_smtp(monkeypatch):
    monkeypatch.setattr(settings, "smtp_host", None)
    monkeypatch.setattr(settings, "smtp_from_email", None)
    collection = MockReservationsCollection()
    collection.documents.append(reservation_doc())
    log_collection = MockReminderLogCollection()
    database = SimpleNamespace(reservations=collection, reminder_log=log_collection)

    asyncio.run(reminder_scheduler.run_one_tick(database))

    assert log_collection.documents == []


def test_scheduler_tick_sends_and_logs(monkeypatch):
    configure_smtp(monkeypatch)
    collection = MockReservationsCollection()
    collection.documents.append(reservation_doc())
    log_collection = MockReminderLogCollection()
    sent: list = []
    monkeypatch.setattr(
        "app.services.reminder_service._send_email", lambda message: sent.append(message)
    )
    database = SimpleNamespace(reservations=collection, reminder_log=log_collection)

    asyncio.run(reminder_scheduler.run_one_tick(database))

    assert len(sent) == 1
    assert log_collection.documents[0]["status"] == "sent"


def test_reminder_endpoint_requires_staff():
    app.dependency_overrides[get_database] = lambda: SimpleNamespace(
        reservations=MockReservationsCollection(),
        reminder_log=MockReminderLogCollection(),
    )
    try:
        with TestClient(app) as client:
            response = client.post("/reminders/run")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 401


def test_reminder_endpoint_returns_config_error_for_missing_smtp(monkeypatch):
    monkeypatch.setattr(settings, "smtp_host", None)
    monkeypatch.setattr(settings, "smtp_from_email", None)
    collection = MockReservationsCollection()
    collection.documents.append(reservation_doc())
    app.dependency_overrides[get_database] = lambda: SimpleNamespace(
        reservations=collection,
        reminder_log=MockReminderLogCollection(),
    )
    try:
        with TestClient(app) as client:
            set_staff_cookie(client)
            response = client.post("/reminders/run")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 503


def test_reminder_endpoint_sends_with_mocked_smtp(monkeypatch):
    configure_smtp(monkeypatch)
    collection = MockReservationsCollection()
    collection.documents.append(reservation_doc())
    sent = []

    class FakeSMTP:
        def __init__(self, host, port, timeout):
            self.host = host
            self.port = port
            self.timeout = timeout

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def send_message(self, message):
            sent.append(message)

    monkeypatch.setattr("app.services.reminder_service.smtplib.SMTP", FakeSMTP)
    app.dependency_overrides[get_database] = lambda: SimpleNamespace(
        reservations=collection,
        reminder_log=MockReminderLogCollection(),
    )
    try:
        with TestClient(app) as client:
            set_staff_cookie(client)
            response = client.post("/reminders/run")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["sent"] == 1
    assert len(sent) == 1

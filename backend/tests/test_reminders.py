"""Reminder selection + send-once tests.

The scheduler itself isn't exercised here; we test the selection rule and
the run() bookkeeping (mark each reminded reservation so it is reminded at
most once). SMTP is unconfigured by default, so no real mail is sent.
"""

import asyncio
import sys
from datetime import date, timedelta
from types import ModuleType, SimpleNamespace
from unittest.mock import AsyncMock

fake_db_module = ModuleType("app.db")
fake_db_module.db = SimpleNamespace()
fake_db_module.ping_db = AsyncMock(return_value=True)
fake_db_module.get_database = lambda: fake_db_module.db
sys.modules.setdefault("app.db", fake_db_module)

from app.dao.reservation_dao import ReservationDAO  # noqa: E402
from app.services.reminder_service import ReminderService  # noqa: E402

from .mocks import MockReservationsCollection  # noqa: E402

TODAY = date(2026, 6, 10)


def _doc(_id, days_out, *, needed, window_enabled, seating, reminder_sent=False,
         status="pending"):
    event_date = (TODAY + timedelta(days=days_out)).isoformat()
    return {
        "_id": _id,
        "event_name": f"Event {_id}",
        "date": event_date,
        "status": status,
        "reminder_sent": reminder_sent,
        "edit_token": f"token-{_id}",
        "contact": {"name": "Kunde", "email": f"{_id}@example.com"},
        "catering": {
            "needed": needed,
            "before_event": {"enabled": window_enabled},
            "during_event": {"enabled": False},
            "after_event": {"enabled": False},
        },
        "setup": {"seating_type": seating},
    }


def _service_with(docs):
    collection = MockReservationsCollection()
    collection.documents.extend(docs)
    return ReminderService(ReservationDAO(SimpleNamespace(reservations=collection))), collection


def test_due_reminders_selects_only_incomplete_in_window():
    due_incomplete = _doc("a", 2, needed=True, window_enabled=False, seating="seminar")
    complete = _doc("b", 2, needed=True, window_enabled=True, seating="seminar")
    no_seating = _doc("c", 2, needed=False, window_enabled=False, seating=None)
    out_of_window = _doc("d", 30, needed=True, window_enabled=False, seating="seminar")
    already_sent = _doc("e", 2, needed=True, window_enabled=False, seating="seminar",
                        reminder_sent=True)
    cancelled = _doc("f", 2, needed=True, window_enabled=False, seating="seminar",
                     status="cancelled")

    service, _ = _service_with(
        [due_incomplete, complete, no_seating, out_of_window, already_sent, cancelled]
    )

    due = asyncio.run(service.due_reminders(today=TODAY))
    due_ids = {doc["_id"] for doc in due}

    assert "a" in due_ids  # incomplete catering window
    assert "c" in due_ids  # missing seating type
    assert "b" not in due_ids  # complete
    assert "d" not in due_ids  # outside the reminder window
    assert "e" not in due_ids  # already reminded
    assert "f" not in due_ids  # cancelled


def test_run_marks_reminders_sent_once():
    due = _doc("a", 2, needed=True, window_enabled=False, seating="seminar")
    service, collection = _service_with([due])

    first = asyncio.run(service.run(today=TODAY))
    second = asyncio.run(service.run(today=TODAY))

    assert first == 1
    assert second == 0  # not reminded again
    assert collection.documents[0]["reminder_sent"] is True

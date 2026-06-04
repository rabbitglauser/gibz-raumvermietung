"""Automatic reminders for reservations with incomplete details."""

import logging
import smtplib
from datetime import date, timedelta
from email.message import EmailMessage

from pydantic import BaseModel, Field

from ..config import settings
from ..dao.reservation_dao import ReservationDAO

logger = logging.getLogger(__name__)


class ReminderConfigurationError(Exception):
    """Raised when SMTP settings are incomplete."""


class ReminderRunResult(BaseModel):
    checked: int = 0
    sent: int = 0
    skipped: int = 0
    errors: list[str] = Field(default_factory=list)


def _reminder_window_days() -> int:
    return getattr(
        settings,
        "reminder_days_before",
        getattr(settings, "reminder_window_days", 7),
    )


def _public_frontend_url() -> str:
    return getattr(
        settings,
        "public_frontend_url",
        getattr(settings, "public_base_url", "http://localhost:3000"),
    )


def find_missing_details(doc: dict) -> list[str]:
    missing: list[str] = []

    catering = doc.get("catering")

    if not isinstance(catering, dict):
        missing.append("Verpflegung")
    elif catering.get("needed") is True:
        windows = [
            catering.get("before_event") or {},
            catering.get("during_event") or {},
            catering.get("after_event") or {},
        ]

        if not any(window.get("enabled") for window in windows):
            missing.append("Verpflegungszeiten")

    setup = doc.get("setup") or {}

    has_equipment = bool(setup.get("equipment"))
    has_services = bool(
        setup.get("microphone_needed")
        or setup.get("technical_support_hours")
        or setup.get("regie_hours")
    )

    if not has_equipment and not has_services:
        missing.append("Material und Technik")

    publication = doc.get("publication")

    if isinstance(publication, dict):
        if publication.get("publish_on_info_screen") and not publication.get(
            "info_screen_text"
        ):
            missing.append("Info-Bildschirm-Text")

    return missing


def _smtp_configured() -> bool:
    return bool(settings.smtp_host and settings.smtp_from_email)


def _build_edit_link(doc: dict) -> str:
    # Query-param form so the link works on the static (GitHub Pages) frontend,
    # which has no dynamic /reservation/edit/[token] route.
    base_url = _public_frontend_url().rstrip("/")
    return f"{base_url}/reservation/edit/?token={doc['edit_token']}"


def _build_message(doc: dict, missing: list[str]) -> EmailMessage:
    contact = doc.get("contact") or {}

    if not contact.get("email"):
        raise ValueError("Reservation is missing contact email")

    message = EmailMessage()
    message["Subject"] = f"Bitte Angaben ergänzen: {doc.get('event_name', 'Reservation')}"
    message["From"] = settings.smtp_from_email or ""
    message["To"] = contact["email"]

    message.set_content(
        "\n".join(
            [
                f"Guten Tag {contact.get('name', '')}",
                "",
                "Bei Ihrer Raumreservation fehlen noch Angaben:",
                *[f"- {item}" for item in missing],
                "",
                f"Anlass: {doc.get('event_name', '-')}",
                f"Datum: {doc.get('date', '-')}",
                f"Raum: {doc.get('room', '-')}",
                "",
                f"Bitte ergänzen Sie die Angaben hier: {_build_edit_link(doc)}",
                "",
                "Freundliche Grüsse",
                "GIBZ Raumvermietung",
            ]
        )
    )

    return message


def _send_email(message: EmailMessage) -> None:
    if not _smtp_configured():
        raise ReminderConfigurationError(
            "SMTP_HOST and SMTP_FROM_EMAIL must be configured"
        )

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
        if settings.smtp_use_tls:
            smtp.starttls()

        if settings.smtp_user and settings.smtp_password:
            smtp.login(settings.smtp_user, settings.smtp_password)

        smtp.send_message(message)


class ReminderService:
    def __init__(self, dao: ReservationDAO) -> None:
        self.dao = dao

    async def due_reminders(self, today: date | None = None) -> list[dict]:
        current_date = today or date.today()
        until = current_date + timedelta(days=_reminder_window_days())

        candidates = await self.dao.list_reminder_candidates(
            current_date.isoformat(),
            until.isoformat(),
        )

        due: list[dict] = []

        for doc in candidates:
            if doc.get("reminder_sent") is True or doc.get("reminder_sent_at"):
                continue

            if find_missing_details(doc):
                due.append(doc)

        return due

    async def run(self, today: date | None = None) -> ReminderRunResult:
        if not _smtp_configured():
            raise ReminderConfigurationError(
                "SMTP_HOST and SMTP_FROM_EMAIL must be configured"
            )

        current_date = today or date.today()
        until = current_date + timedelta(days=_reminder_window_days())

        docs = await self.dao.list_reminder_candidates(
            current_date.isoformat(),
            until.isoformat(),
        )

        result = ReminderRunResult(checked=len(docs))

        for doc in docs:
            if doc.get("reminder_sent") is True or doc.get("reminder_sent_at"):
                result.skipped += 1
                continue

            missing = find_missing_details(doc)

            if not missing:
                result.skipped += 1
                continue

            if not doc.get("edit_token"):
                result.skipped += 1
                result.errors.append(f"{doc.get('_id')}: missing edit token")
                continue

            try:
                message = _build_message(doc, missing)
                _send_email(message)
            except Exception as exc:
                result.errors.append(f"{doc.get('_id')}: {exc}")
                continue

            await self.dao.mark_reminder_sent(str(doc["_id"]))
            result.sent += 1

        if result.sent:
            logger.info("Reminder job sent %d reminder(s)", result.sent)

        if result.errors:
            logger.warning("Reminder job finished with errors: %s", result.errors)

        return result
from datetime import date, datetime, timedelta, timezone
from email.message import EmailMessage
import smtplib

from pydantic import BaseModel, Field

from ..config import settings
from ..dao.reservation_dao import ReminderLogDAO, ReservationDAO


class ReminderConfigurationError(Exception):
    """Raised when SMTP settings are incomplete."""


class ReminderRunResult(BaseModel):
    checked: int = 0
    sent: int = 0
    skipped: int = 0
    errors: list[str] = Field(default_factory=list)


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
    if not isinstance(publication, dict):
        missing.append("Publikation")
    elif publication.get("publish_on_info_screen") and not publication.get(
        "info_screen_text"
    ):
        missing.append("Info-Bildschirm-Text")

    return missing


def _smtp_configured() -> bool:
    return bool(settings.smtp_host and settings.smtp_from_email)


def _build_edit_link(doc: dict) -> str:
    return f"{settings.public_frontend_url.rstrip('/')}/reservation/edit/{doc['edit_token']}"


def _build_message(doc: dict, missing: list[str]) -> EmailMessage:
    message = EmailMessage()
    message["Subject"] = f"Reservation vervollstaendigen: {doc['event_name']}"
    message["From"] = settings.smtp_from_email or ""
    message["To"] = doc["contact"]["email"]
    message.set_content(
        "\n".join(
            [
                f"Guten Tag {doc['contact']['name']}",
                "",
                "Bei Ihrer Raumreservation fehlen noch Angaben:",
                *[f"- {item}" for item in missing],
                "",
                f"Anlass: {doc['event_name']}",
                f"Datum: {doc['date']}",
                f"Raum: {doc['room']}",
                "",
                f"Bitte ergaenzen Sie die Angaben hier: {_build_edit_link(doc)}",
                "",
                "Freundliche Gruesse",
                "GIBZ Raumreservation",
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
    def __init__(
        self,
        dao: ReservationDAO,
        log_dao: ReminderLogDAO | None = None,
    ) -> None:
        self.dao = dao
        self.log_dao = log_dao

    async def _log(
        self,
        reservation_id: str,
        status: str,
        *,
        missing_fields: list[str] | None = None,
        error: str | None = None,
    ) -> None:
        if self.log_dao is None:
            return
        await self.log_dao.record(
            reservation_id=reservation_id,
            status=status,
            missing_fields=missing_fields,
            error=error,
        )

    async def run(self, today: date | None = None) -> ReminderRunResult:
        if not _smtp_configured():
            raise ReminderConfigurationError(
                "SMTP_HOST and SMTP_FROM_EMAIL must be configured"
            )

        current_date = today or date.today()
        until = current_date + timedelta(days=settings.reminder_days_before)
        docs = await self.dao.list_reminder_candidates(
            current_date.isoformat(), until.isoformat()
        )
        result = ReminderRunResult(checked=len(docs))

        for doc in docs:
            reservation_id = str(doc.get("_id"))

            if doc.get("reminder_sent_at"):
                result.skipped += 1
                await self._log(reservation_id, "skipped", error="already_sent")
                continue

            missing = find_missing_details(doc)
            if not missing:
                result.skipped += 1
                await self._log(reservation_id, "skipped", error="complete")
                continue

            if not doc.get("edit_token"):
                result.skipped += 1
                result.errors.append(f"{reservation_id}: missing edit token")
                await self._log(
                    reservation_id,
                    "error",
                    missing_fields=missing,
                    error="missing edit token",
                )
                continue

            try:
                _send_email(_build_message(doc, missing))
            except Exception as exc:
                result.errors.append(f"{reservation_id}: {exc}")
                await self._log(
                    reservation_id,
                    "error",
                    missing_fields=missing,
                    error=str(exc),
                )
                continue

            await self.dao.mark_reminder_sent(reservation_id)
            result.sent += 1
            await self._log(reservation_id, "sent", missing_fields=missing)

        return result

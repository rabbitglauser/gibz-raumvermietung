"""Automatic reminders for reservations with incomplete details.

Selection rule lives in one place (`reservation_is_incomplete`): a
reservation is due for a reminder when it is active, falls within the
configured window before the event, still misses catering/setup details,
and has not already been reminded. Each reservation is reminded at most
once (`reminder_sent` flag).
"""

import logging
from datetime import date, timedelta
from typing import Optional

from ..config import settings
from ..dao.reservation_dao import ReservationDAO
from ..email_utils import send_email
from ..models.reservation import reservation_is_incomplete

logger = logging.getLogger(__name__)


class ReminderService:
    def __init__(self, dao: ReservationDAO) -> None:
        self.dao = dao

    async def due_reminders(self, today: Optional[date] = None) -> list[dict]:
        today = today or date.today()
        cutoff = (today + timedelta(days=settings.reminder_window_days)).isoformat()
        candidates = await self.dao.list_pending_reminders(cutoff)
        return [doc for doc in candidates if reservation_is_incomplete(doc)]

    def _build_message(self, doc: dict) -> tuple[str, str]:
        edit_link = (
            f"{settings.public_base_url}/reservation/edit/?token={doc['edit_token']}"
        )
        subject = f"Bitte Angaben ergänzen: {doc['event_name']} am {doc['date']}"
        body = (
            f"Guten Tag {doc['contact']['name']}\n\n"
            f"Für Ihre Reservation \"{doc['event_name']}\" am {doc['date']} fehlen "
            "noch Angaben zu Catering und/oder Einrichtung.\n\n"
            f"Bitte ergänzen Sie diese über folgenden Link:\n{edit_link}\n\n"
            "Freundliche Grüsse\nGIBZ Raumvermietung"
        )
        return subject, body

    async def run(self, today: Optional[date] = None) -> int:
        """Send reminders for all due reservations. Returns the count sent."""
        sent = 0
        for doc in await self.due_reminders(today):
            subject, body = self._build_message(doc)
            send_email(doc["contact"]["email"], subject, body)
            await self.dao.mark_reminder_sent(doc["_id"])
            sent += 1
        if sent:
            logger.info("Reminder job sent %d reminder(s)", sent)
        return sent

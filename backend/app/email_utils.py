"""Minimal SMTP email sending for reminder notifications.

Uses the stdlib ``smtplib`` so there is no extra dependency. When
``settings.smtp_host`` is empty the send is skipped and logged — reminders
are best-effort and must never crash the scheduler (see PRD NFR / risks).
"""

import logging
import smtplib
from email.message import EmailMessage

from .config import settings

logger = logging.getLogger(__name__)


def send_email(to: str, subject: str, body: str) -> bool:
    """Send a plain-text email. Returns True if it was handed to SMTP."""
    if not settings.smtp_host:
        logger.info("SMTP not configured — skipping email to %s (%s)", to, subject)
        return False

    message = EmailMessage()
    message["From"] = settings.smtp_from
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
            if settings.smtp_user:
                smtp.starttls()
                smtp.login(settings.smtp_user, settings.smtp_password)
            smtp.send_message(message)
        logger.info("Sent reminder email to %s", to)
        return True
    except Exception:  # noqa: BLE001 - best-effort, never propagate
        logger.exception("Failed to send reminder email to %s", to)
        return False

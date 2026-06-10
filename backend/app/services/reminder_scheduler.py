import asyncio
import logging

from ..config import settings
from ..dao.reservation_dao import ReminderLogDAO, ReservationDAO
from .reminder_service import ReminderConfigurationError, ReminderService

logger = logging.getLogger(__name__)


async def run_one_tick(database) -> None:
    service = ReminderService(
        ReservationDAO(database),
        ReminderLogDAO(database),
    )
    try:
        result = await service.run()
    except ReminderConfigurationError:
        logger.warning("reminder scheduler: SMTP not configured, skipping tick")
        return
    logger.info(
        "reminder run: checked=%d sent=%d skipped=%d errors=%d",
        result.checked,
        result.sent,
        result.skipped,
        len(result.errors),
    )


async def _scheduler_loop(database, interval_seconds: int) -> None:
    while True:
        try:
            await run_one_tick(database)
        except Exception:
            logger.exception("reminder scheduler tick failed")
        await asyncio.sleep(interval_seconds)


def start_reminder_scheduler(database) -> asyncio.Task | None:
    if not settings.reminder_scheduler_enabled:
        return None
    return asyncio.create_task(
        _scheduler_loop(database, settings.reminder_scheduler_interval_seconds)
    )

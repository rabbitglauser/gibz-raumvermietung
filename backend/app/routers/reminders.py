from fastapi import APIRouter, Depends, HTTPException, status

from ..dao.reservation_dao import ReminderLogDAO, ReservationDAO
from ..db import get_database
from ..services.reminder_service import (
    ReminderConfigurationError,
    ReminderRunResult,
    ReminderService,
)
from .auth import require_staff

router = APIRouter(prefix="/reminders", tags=["reminders"])


def get_reminder_service(database=Depends(get_database)) -> ReminderService:
    return ReminderService(ReservationDAO(database), ReminderLogDAO(database))


@router.post("/run", response_model=ReminderRunResult)
async def run_reminders(
    service: ReminderService = Depends(get_reminder_service),
    _staff=Depends(require_staff),
):
    try:
        return await service.run()
    except ReminderConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

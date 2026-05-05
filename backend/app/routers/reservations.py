from fastapi import APIRouter, Depends, HTTPException, status

from ..dao.reservation_dao import ReservationDAO
from ..db import get_database
from ..models.reservation import (
    ReservationCreate,
    ReservationList,
    ReservationOut,
)
from ..services.reservation_service import (
    ReservationConflictError,
    ReservationService,
)

router = APIRouter(prefix="/reservations", tags=["reservations"])


def get_reservation_service(database=Depends(get_database)) -> ReservationService:
    return ReservationService(ReservationDAO(database))


@router.post("", response_model=ReservationOut, status_code=status.HTTP_201_CREATED)
async def create_reservation(
    payload: ReservationCreate,
    service: ReservationService = Depends(get_reservation_service),
):
    try:
        return await service.create(payload)
    except ReservationConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))


@router.get("", response_model=ReservationList)
async def list_reservations(
    service: ReservationService = Depends(get_reservation_service),
):
    items = await service.list_all()
    return {"items": items}

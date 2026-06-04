from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from ..dao.reservation_dao import ReservationDAO
from ..db import get_database
from ..models.enums import ReservationStatus
from ..models.reservation import (
    AvailabilityList,
    ReservationCreate,
    ReservationCreated,
    ReservationList,
    ReservationOut,
    ReservationUpdate,
    StaffReservationUpdate,
)
from ..services.reservation_service import (
    EditDeadlinePassedError,
    ReservationConflictError,
    ReservationNotFoundError,
    ReservationService,
    ReservationValidationError,
)
from .auth import require_admin, require_staff

router = APIRouter(prefix="/reservations", tags=["reservations"])


class ReservationStatusUpdate(BaseModel):
    status: ReservationStatus


def get_reservation_service(database=Depends(get_database)) -> ReservationService:
    return ReservationService(ReservationDAO(database))


@router.post("", response_model=ReservationCreated, status_code=status.HTTP_201_CREATED)
async def create_reservation(
    payload: ReservationCreate,
    service: ReservationService = Depends(get_reservation_service),
):
    try:
        return await service.create(payload)
    except ReservationConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except ReservationValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc


@router.get("", response_model=ReservationList)
async def list_reservations(
    service: ReservationService = Depends(get_reservation_service),
    _staff=Depends(require_staff),
    date_from: Optional[str] = Query(default=None),
    date_to: Optional[str] = Query(default=None),
    has_catering: Optional[bool] = Query(default=None),
    upcoming: Optional[bool] = Query(default=None),
    past: Optional[bool] = Query(default=None),
    reservation_status: Optional[ReservationStatus] = Query(default=None, alias="status"),
    q: Optional[str] = Query(default=None),
):
    if upcoming and past:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="upcoming and past filters cannot both be true",
        )

    filters = {
        "date_from": date_from,
        "date_to": date_to,
        "has_catering": has_catering,
        "upcoming": upcoming,
        "past": past,
        "status": reservation_status.value if reservation_status else None,
        "q": q,
    }

    items = await service.list_all(filters)
    return {"items": items}


@router.get("/availability", response_model=AvailabilityList)
async def list_availability(
    service: ReservationService = Depends(get_reservation_service),
    room: Optional[str] = Query(default=None),
):
    """Public endpoint exposing only booked time slots without customer data."""
    items = await service.availability(room)
    return {"items": items}


@router.get("/edit/{edit_token}", response_model=ReservationOut)
async def get_reservation_by_token(
    edit_token: str,
    service: ReservationService = Depends(get_reservation_service),
):
    try:
        reservation = await service.get_by_token(edit_token)
    except ReservationNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    if reservation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found",
        )

    return reservation


@router.patch("/edit/{edit_token}", response_model=ReservationOut)
async def update_reservation_by_token(
    edit_token: str,
    payload: ReservationUpdate,
    service: ReservationService = Depends(get_reservation_service),
):
    try:
        return await service.customer_update(edit_token, payload)
    except ReservationNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found",
        ) from exc
    except EditDeadlinePassedError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc
    except ReservationConflictError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
    except ReservationValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc


@router.get("/{reservation_id}", response_model=ReservationOut)
async def get_reservation(
    reservation_id: str,
    service: ReservationService = Depends(get_reservation_service),
    _staff=Depends(require_staff),
):
    reservation = await service.get_by_id(reservation_id)

    if reservation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found",
        )

    return reservation


@router.patch("/{reservation_id}", response_model=ReservationOut)
async def update_reservation(
    reservation_id: str,
    payload: StaffReservationUpdate,
    service: ReservationService = Depends(get_reservation_service),
    _staff=Depends(require_staff),
):
    try:
        updated = await service.staff_update(reservation_id, payload)
    except ReservationConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except ReservationValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found",
        )

    return updated


@router.patch("/{reservation_id}/status", response_model=ReservationOut)
async def update_reservation_status(
    reservation_id: str,
    payload: ReservationStatusUpdate,
    service: ReservationService = Depends(get_reservation_service),
    _staff=Depends(require_staff),
):
    updated = await service.update_status(reservation_id, payload.status)

    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found",
        )

    return updated


@router.delete("/{reservation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reservation(
    reservation_id: str,
    service: ReservationService = Depends(get_reservation_service),
    _admin=Depends(require_admin),
):
    deleted = await service.delete(reservation_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found",
        )
from datetime import date, datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status

from ..config import settings
from ..dao.reservation_dao import ReservationDAO
from ..db import get_database
from ..models.enums import ReservationStatus
from ..models.reservation import ReservationList, ReservationOut
from ..services.reservation_service import ReservationService

router = APIRouter(prefix="/staff", tags=["staff"])


def get_reservation_service(database=Depends(get_database)) -> ReservationService:
    return ReservationService(ReservationDAO(database))


def get_reservation_dao(database=Depends(get_database)) -> ReservationDAO:
    return ReservationDAO(database)


async def require_staff(authorization: Optional[str] = Header(default=None)) -> None:
    expected = f"Bearer {settings.staff_secret_token}"
    if not authorization or authorization != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing staff token",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.get("/reservations", response_model=ReservationList)
async def list_reservations(
    date_from: Optional[date] = Query(default=None),
    date_to: Optional[date] = Query(default=None),
    catering: Optional[bool] = Query(default=None),
    upcoming: Optional[bool] = Query(default=None),
    room: Optional[str] = Query(default=None),
    reservation_status: Optional[ReservationStatus] = Query(default=None, alias="status"),
    service: ReservationService = Depends(get_reservation_service),
    _: None = Depends(require_staff),
):
    items = await service.list_all()
    today = datetime.now(timezone.utc).date().isoformat()

    def _keep(r: dict) -> bool:
        r_date = r["date"] if isinstance(r["date"], str) else r["date"].isoformat()
        if date_from and r_date < date_from.isoformat():
            return False
        if date_to and r_date > date_to.isoformat():
            return False
        if upcoming is True and r_date < today:
            return False
        if upcoming is False and r_date >= today:
            return False
        if room and r.get("room") != room:
            return False
        if reservation_status and r.get("status") != reservation_status.value:
            return False
        if catering is True and not r.get("catering", {}).get("needed", False):
            return False
        return True

    return {"items": [r for r in items if _keep(r)]}


@router.get("/reservations/{reservation_id}", response_model=ReservationOut)
async def get_reservation(
    reservation_id: str,
    service: ReservationService = Depends(get_reservation_service),
    _: None = Depends(require_staff),
):
    item = await service.get_by_id(reservation_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found")
    return item


@router.patch("/reservations/{reservation_id}/status", response_model=ReservationOut)
async def update_status(
    reservation_id: str,
    new_status: ReservationStatus = Query(...),
    service: ReservationService = Depends(get_reservation_service),
    _: None = Depends(require_staff),
):
    item = await service.update_status(reservation_id, new_status)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found")
    return item


@router.delete("/reservations/{reservation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reservation(
    reservation_id: str,
    dao: ReservationDAO = Depends(get_reservation_dao),
    _: None = Depends(require_staff),
):
    deleted = await dao.delete(reservation_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found")

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .dao.reservation_dao import ReservationDAO
from .db import db, ping_db
from .routers.auth import router as auth_router
from .routers.reservations import router as reservations_router
from .routers.rooms import router as rooms_router
from .services.reminder_service import ReminderService

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.db_ok = await ping_db()

    scheduler = None
    if settings.reminders_enabled:
        # Imported lazily so the dependency is only needed when reminders run.
        from apscheduler.schedulers.asyncio import AsyncIOScheduler

        async def reminder_job():
            try:
                await ReminderService(ReservationDAO(db)).run()
            except Exception:  # noqa: BLE001 - never let a job kill the loop
                logger.exception("Reminder job failed")

        scheduler = AsyncIOScheduler()
        scheduler.add_job(
            reminder_job,
            "interval",
            minutes=settings.reminder_interval_minutes,
            id="reservation_reminders",
        )
        scheduler.start()
        logger.info(
            "Reminder scheduler started (every %d min)",
            settings.reminder_interval_minutes,
        )

    try:
        yield
    finally:
        if scheduler is not None:
            scheduler.shutdown(wait=False)


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(reservations_router)
app.include_router(rooms_router)


@app.get("/")
async def root():
    return {"message": "Backend is running"}


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": settings.app_name,
    }

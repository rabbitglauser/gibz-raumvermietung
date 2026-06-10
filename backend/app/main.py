import asyncio
import contextlib
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .db import get_database, ping_db
from .routers.auth import router as auth_router
from .routers.reminders import router as reminders_router
from .routers.reservations import router as reservations_router
from .routers.rooms import router as rooms_router
from .services.auth_service import seed_demo_staff_user
from .services.reminder_scheduler import start_reminder_scheduler

_FIELD_LABELS: dict[str, str] = {
    "event_name": "Veranstaltungsname",
    "date": "Datum",
    "setup_start_time": "Aufbauzeit",
    "start_time": "Startzeit",
    "end_time": "Endzeit",
    "room": "Raum",
    "attendee_count": "Teilnehmerzahl",
    "organizer_type": "Veranstaltertyp",
    "contact.name": "Kontaktname",
    "contact.email": "E-Mail",
    "contact.phone": "Telefon",
    "contact.department": "Abteilung",
    "billing_address.name": "Rechnungsadresse Name",
    "billing_address.street": "Strasse",
    "billing_address.postal_code_city": "PLZ / Ort",
    "billing_address.invoice_note": "Rechnungsvermerk",
    "terms_accepted": "AGB",
    "setup.seating_type": "Bestuhlung",
    "setup.microphone_needed": "Mikrofonanlage",
    "setup.technical_support_hours": "Technischer Support",
    "setup.regie_hours": "Regie",
    "catering.needed": "Verpflegung",
    "catering.before_event": "Verpflegung vor der Veranstaltung",
    "catering.during_event": "Verpflegung während der Veranstaltung",
    "catering.after_event": "Verpflegung nach der Veranstaltung",
    "remarks": "Bemerkungen",
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.db_ok = await ping_db()
    if app.state.db_ok:
        app.state.demo_staff_seeded = await seed_demo_staff_user(get_database())
        app.state.reminder_task = start_reminder_scheduler(get_database())
    else:
        app.state.demo_staff_seeded = False
        app.state.reminder_task = None
    try:
        yield
    finally:
        task = getattr(app.state, "reminder_task", None)
        if task is not None:
            task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await task


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(reservations_router)
app.include_router(rooms_router)
app.include_router(auth_router)
app.include_router(reminders_router)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    errors = []
    for err in exc.errors():
        loc_parts = [str(p) for p in err["loc"] if p != "body"]
        field = ".".join(loc_parts)
        label = _FIELD_LABELS.get(
            field, field.replace("_", " ").capitalize() or "Eingabe"
        )
        errors.append({"field": field, "label": label, "message": err["msg"]})
    return JSONResponse(status_code=422, content={"detail": errors})


@app.get("/")
async def root():
    return {"message": "Backend is running"}


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": settings.app_name,
    }

# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project

Room rental ("Raumvermietung") system for GIBZ — booking three specific rooms (seminar room 5.003/004, seminar room 2.112, aula 1.005) with per-room rules for capacity, seating, equipment, microphone, and technical support. Stack: FastAPI + MongoDB backend, Next.js 16 (App Router) + Tailwind v4 frontend, Docker Compose for orchestration.

## Layout

- `backend/app/` — FastAPI app. `main.py` (lifespan + CORS), `config.py` (pydantic-settings, reads `backend/.env`), `db.py` (single shared `AsyncMongoClient`), `routers/reservations.py` (all reservation logic + Pydantic models).
- `backend/tests/` — pytest suite. `pytest.ini` at the repo root sets `pythonpath = backend` and `testpaths = backend/tests`.
- `frontend/src/` — Next.js app. `app/page.tsx` is a server component that calls `lib/api.ts::getHealth()`. Components follow atomic design: `components/{atoms,molecules,organisms,templates}/`.
- `docker-compose.yml` — `mongodb` (port 27017), `backend` (8000), `frontend` (3000). Inside the compose network the frontend reaches the backend at `http://backend:8000`; for browser-side fetches it uses `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`.

## Commands

Backend (run from repo root unless noted):

```bash
# install
pip install -r backend/requirements.txt -r backend/requirements-dev.txt

# dev server
uvicorn app.main:app --reload --app-dir backend

# tests — pytest.ini handles pythonpath/testpaths, so no args needed
pytest
pytest -v
pytest backend/tests/test_reservations.py::test_create_reservation_returns_confirmation
pytest --junitxml=backend/tests/report.xml
```

Frontend (run from `frontend/`):

```bash
npm run dev      # next dev (port 3000)
npm run build
npm run lint     # eslint (flat config via eslint-config-next)
```

Full stack:

```bash
docker compose up --build
```

## Architecture notes

**Reservation model is the entire backend.** `routers/reservations.py` contains every domain entity: `RoomId`, `OrganizerType`, `ReservationStatus`, `SeatingType`, `EquipmentType`, the nested `ContactInfo` / `BillingAddress` / `CateringInfo` / `SetupInfo` / `PublicationInfo` models, and the `ReservationCreate` aggregate. Per-room validation runs through the `ROOM_RULES` table at the top of the file — `validate_room_rules()` enforces capacity, allowed seating types, allowed equipment, and microphone/technical-support/regie eligibility. When adding a new room or rule, edit `ROOM_RULES` and the relevant enum.

**Cross-field validation lives in pydantic `model_validator(mode="after")`**, not in the route. `ReservationCreate.validate_business_rules` enforces `setup_start_time <= start_time < end_time` and calls `validate_room_rules`. `CateringInfo` / `CateringWindow` self-validate that enabled windows have times and that `needed=True` requires at least one enabled window. Invalid input therefore returns 422 from FastAPI's request-validation layer, not 400 from the handler.

**Conflict detection** (`has_reservation_conflict`) queries Mongo with overlap semantics `setup_start_time < new.end_time` AND `end_time > new.setup_start_time`, scoped by room+date and excluding `cancelled`/`rejected`. Adjacent bookings (one ends at the same instant another starts) are intentionally allowed — there is a regression test for this.

**MongoDB driver is async (`pymongo.AsyncMongoClient`).** `app.db` exposes a module-level `db` and `client`; tests stub this module before import (see below). Times/dates are serialized via `payload.model_dump(mode="json")` so they hit Mongo as ISO strings — the conflict query relies on lexicographic comparison of those strings, which only works because they are zero-padded `HH:MM` / `YYYY-MM-DD`.

**Tests never touch real Mongo.** `backend/tests/conftest.py` (and a duplicate guard at the top of `test_reservations.py`) installs a fake `app.db` module into `sys.modules` *before* importing the FastAPI app. `MockReservationsCollection` in `test_reservations.py` is a hand-rolled in-memory collection with a tiny query interpreter (`$nin`, `$lt`, `$gt`) — extend `matches_operator` if you add a new Mongo operator to a query. The `mock_collection` fixture monkeypatches the router's `db` reference for each test.

**Skipped test files (`test_edit_deadline.py`, `test_staff_routes.py`) are placeholders** for routes that don't exist yet (`PUT/PATCH /reservations/{id}` and a staff-auth dependency). Un-skip when those land; `backend/tests/README.md` tracks coverage status.

**Frontend is intentionally minimal.** Currently a single server-rendered page that displays `/health`. Components are organized by atomic design even though the population is small — keep new UI in the appropriate tier. API base URL resolution: `API_BASE_URL` (server) → `NEXT_PUBLIC_API_BASE_URL` (browser) → `http://localhost:8000`.

## Conventions

- Validate at the model layer with pydantic validators; keep route handlers thin.
- Status codes: 201 on create, 409 on booking conflict, 422 on validation error (FastAPI default).
- Don't bypass `ROOM_RULES` — adding ad-hoc `if room == ...` checks in handlers fragments the rule surface.
- Times in queries/storage are ISO strings, not `datetime.time` objects. Keep them zero-padded.

# Project Status - Raumvermietung

Last updated: 2026-05-26

Submission dates:

| Deliverable | Date | Time left |
|---|---:|---:|
| Code + documentation PDF | 2026-06-10 | 15 days |
| Screencast | 2026-06-24 | 29 days |
| GitHub repository | accepted by teacher | done |

## Current Snapshot

The project has the customer-facing booking core in place: room catalogue, room detail pages, booking dialog, reservation creation, room rule validation, conflict checks, customer edit tokens, edit deadline checks, Docker Compose, MongoDB persistence, and backup/restore scripts.

The remaining work is concentrated in four areas:

1. Add the frontend staff dashboard on top of the finished backend staff API.
2. Add reminder/email automation or clearly document it as unfinished.
3. Polish the customer confirmation/edit-link flow.
4. Consolidate the documentation into the required final PDF and record the screencast.

Current automated test result from `pytest -q` on 2026-05-26:

```text
58 passed, 1 warning
```

The previous validation-test failures are fixed, and the staff-route tests are active.

## Do This Next

1. **Frontend staff dashboard** - use the existing auth cookie flow and backend status/filter endpoints.
2. **Reminder/email automation** - implement or document as intentionally unfinished.
3. **Final documentation + screencast** - export the final PDF and record the green test run.

## Must-Haves

### Reservation Lifecycle

- [x] `POST /reservations`
- [x] Conflict detection for overlapping bookings
- [x] Adjacent bookings allowed
- [x] Edit token generated on reservation creation
- [x] `GET /reservations/edit/{token}`
- [x] `PUT /reservations/edit/{token}`
- [x] Edit deadline check returns 403 after cutoff
- [x] Configurable `edit_deadline_hours` in `backend/app/config.py`
- [ ] Staff/admin edit by reservation ID, e.g. `PUT/PATCH /reservations/{id}`
- [x] Cancel/delete route, e.g. `DELETE /reservations/{id}` or status to `cancelled`
- [ ] Decide whether `edit_deadline_hours` is acceptable or whether school docs require `EDIT_DEADLINE_DAYS`

### Staff Access

- [x] Staff login endpoint
- [x] Password hashing
- [x] JWT/session handling
- [x] Staff auth dependency
- [x] Unskip and implement `backend/tests/test_staff_routes.py`
- [x] Staff-only status route: confirm/reject/cancel
- [ ] Staff dashboard frontend
- [ ] Reservation table/detail view for staff

### Reservation Filters

- [x] `GET /reservations?from_date=...`
- [x] `GET /reservations?to_date=...`
- [x] `GET /reservations?has_catering=true|false`
- [x] `GET /reservations?upcoming=true`
- [x] `GET /reservations?past=true`
- [ ] Optional: search by contact name or room
- [x] Add backend tests for each filter

### Reminder Automation

- [ ] Add reminder settings in `config.py` and `.env.example`
- [ ] Add SMTP settings in `config.py` and `.env.example`
- [ ] Add reservation fields such as `reminder_sent_at` and `reminder_count`
- [ ] Implement missing-info detection for catering/setup/material fields
- [ ] Add scheduler in FastAPI lifespan or document manual trigger alternative
- [ ] Add email template containing the edit link
- [ ] Add reminder tests with mocked current time/email sender

### Customer Flow

- [x] `/agb` page
- [x] AGB checkbox in booking wizard
- [x] Backend rejects `terms_accepted: false`
- [x] Customer edit page at `/reservation/edit/[token]`
- [ ] Show/copy edit link clearly after successful booking
- [ ] Optional: send confirmation email with edit link
- [ ] Polish old `/reservation` standalone form or remove it if the room-detail booking dialog is the real flow

### Operations

- [x] Docker Compose for MongoDB/backend/frontend
- [x] Named MongoDB volume
- [x] Backup script: `scripts/backup-mongodb.ps1`
- [x] Restore script: `scripts/restore-mongodb.ps1`
- [x] Restore verification script: `scripts/verify-mongodb-restore.ps1`
- [x] `docs/BACKUP_RESTORE.md`
- [ ] Add/update `.env.example` for backend settings, edit deadline, auth secret, reminder, and SMTP values
- [ ] Verify `docker compose up --build` from a clean checkout

## Documentation Still Needed

- [ ] Consolidate relevant `docs/*.md` files into one final PDF
- [x] Update `docs/TESTING.md` after fixing the failing tests
- [x] Add final test results, including the exact `pytest -q` result
- [ ] Add architecture diagram export from `docs/diagrams/architecture.excalidraw`
- [ ] Document technology stack and why MongoDB fits the data model
- [ ] Document installation/startup steps with Docker Compose
- [ ] Document backup/restore procedure for IT/support
- [ ] Document known unfinished features honestly if staff auth/reminders are not completed
- [ ] Write chapter 3.1 for any implemented extra feature
- [ ] Write conclusion/reflection

## Tests Still Needed

- [x] Fix failing `backend/tests/test_validation_errors.py`
- [x] Re-run full backend suite until green
- [x] Unskip/finish `backend/tests/test_staff_routes.py`
- [x] Add filter tests for staff reservation list
- [x] Add auth tests for 401/403 paths
- [ ] Add reminder tests
- [ ] Add at least a manual frontend test checklist for booking dialog and edit page
- [ ] Optional: add frontend unit/e2e tests if time remains

## Screencast Still Needed

- [ ] Write a script under 10 minutes
- [ ] Show room catalogue and room detail
- [ ] Show successful reservation creation
- [ ] Show conflict prevention
- [ ] Show customer edit via token link
- [ ] Show staff dashboard if implemented
- [ ] Show backup/restore or MongoDB persistence briefly
- [ ] Show test run result
- [ ] Export as the required MP4 file name

## Already Done

- [x] FastAPI app with health/root endpoints
- [x] MongoDB async access through DAO/service layers
- [x] Room model, seed-backed room catalogue, and room detail API
- [x] Reservation model with Pydantic validators
- [x] Per-room validation through `ROOM_RULES`
- [x] Booking window validation
- [x] Catering window validation
- [x] Conflict detection excluding `cancelled` and `rejected`
- [x] Reservation creation returns `id`, `status`, timestamps, and `edit_token`
- [x] Customer edit endpoints by token
- [x] Edit deadline behavior with tests
- [x] Frontend room catalogue and detail pages
- [x] Frontend booking dialog posts to backend
- [x] AGB page and AGB checkbox
- [x] Customer edit page
- [x] Staff auth API with HTTP-only cookie JWT
- [x] Staff status/cancel API
- [x] Reservation filters
- [x] Docker Compose stack
- [x] Backup/restore documentation and scripts

## Suggested Execution Order

1. Build a small staff dashboard frontend for login, filters, status updates, and cancellation.
2. Decide whether reminder automation is required for the final grade. If yes, implement a minimal SMTP-backed service; if no, document it as unfinished.
3. Add/update `.env.example` for auth, edit deadline, reminder, and SMTP settings.
4. Run backend tests, frontend lint/build, and Docker Compose smoke test.
5. Update documentation and export final PDF.
6. Record screencast using the green test result and demo data.

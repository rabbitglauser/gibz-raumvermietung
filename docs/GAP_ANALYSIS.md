# Project Status - Raumvermietung

Last updated: 2026-05-26

| Deliverable | Date | Time left |
|---|---:|---:|
| Code + documentation PDF | 2026-06-10 | 15 days |
| Screencast | 2026-06-24 | 29 days |
| GitHub repository | accepted by teacher | done |

## Current Snapshot

The core application is implemented: public room catalogue, booking dialog,
reservation validation, conflict detection, customer edit links, edit deadline,
staff authentication, staff dashboard, reservation filters, status/cancel
actions, manual SMTP reminders, Docker Compose, MongoDB persistence, and backup
scripts.

Latest backend test result:

```text
pytest -q
65 passed, 1 warning
```

## Do This Next

1. **Docker/browser smoke test** - verify public booking, staff login, filters,
   status changes, cancellation, and reminder button.
2. **Customer confirmation polish** - show/copy the edit link clearly after
   booking.
3. **Final submission tasks** - export the final PDF and record the screencast.

## Must-Haves

### Reservation Lifecycle

- [x] `POST /reservations`
- [x] Conflict detection for overlapping bookings
- [x] Adjacent bookings allowed
- [x] Edit token generated on reservation creation
- [x] `GET /reservations/edit/{token}`
- [x] `PUT /reservations/edit/{token}`
- [x] Edit deadline check returns 403 after cutoff
- [x] Configurable `edit_deadline_hours`
- [ ] Staff/admin full edit by reservation ID, e.g. `PUT/PATCH /reservations/{id}`
- [x] Cancel/delete route via `DELETE /reservations/{id}` -> `cancelled`

### Staff Access

- [x] Staff login endpoint
- [x] Password hashing
- [x] JWT cookie session
- [x] Staff auth dependency
- [x] Staff-only status route: confirm/reject/cancel
- [x] Staff dashboard frontend
- [x] Reservation table/detail view for staff

### Reservation Filters

- [x] `GET /reservations?from_date=...`
- [x] `GET /reservations?to_date=...`
- [x] `GET /reservations?has_catering=true|false`
- [x] `GET /reservations?upcoming=true`
- [x] `GET /reservations?past=true`
- [ ] Optional: search by contact name or room
- [x] Backend tests for filters

### Reminder Automation

- [x] Reminder settings in `config.py` and `.env.example`
- [x] SMTP settings in `config.py` and `.env.example`
- [x] Reservation fields `reminder_sent_at` and `reminder_count`
- [x] Missing-info detection
- [x] Manual staff trigger via `POST /reminders/run`
- [x] Email template with customer edit link
- [x] Reminder tests with mocked SMTP
- [ ] Optional: scheduled background reminder job

### Customer Flow

- [x] `/agb` page
- [x] AGB checkbox in booking wizard
- [x] Backend rejects `terms_accepted: false`
- [x] Customer edit page at `/reservation/edit/[token]`
- [ ] Show/copy edit link clearly after successful booking
- [ ] Optional: send immediate confirmation email with edit link

### Operations

- [x] Docker Compose for MongoDB/backend/frontend
- [x] Named MongoDB volume
- [x] Backup script: `scripts/backup-mongodb.ps1`
- [x] Restore script: `scripts/restore-mongodb.ps1`
- [x] Restore verification script: `scripts/verify-mongodb-restore.ps1`
- [x] `docs/BACKUP_RESTORE.md`
- [x] `backend/.env.example`
- [ ] Verify `docker compose up --build` from a clean checkout

## Documentation

- [x] Update `docs/TESTING.md`
- [x] Add final backend test result
- [x] Document technology stack and MongoDB fit
- [x] Document installation/startup steps with Docker Compose
- [x] Document backup/restore procedure
- [x] Document known limitations
- [x] Write chapter 3.1 additional functions
- [x] Write conclusion/reflection
- [x] Add screencast script
- [ ] Export final PDF

## Tests

- [x] Validation error tests
- [x] Reservation create/list/conflict/filter tests
- [x] Edit-deadline tests
- [x] Staff auth and protected route tests
- [x] Reminder tests
- [ ] Manual frontend browser checklist
- [ ] Optional frontend unit/e2e tests

## Screencast

- [x] Script under 10 minutes
- [x] Room catalogue and room detail section
- [x] Successful reservation creation section
- [x] Conflict prevention section
- [x] Customer edit via token section
- [x] Staff dashboard section
- [x] Reminder section
- [x] Test result section
- [ ] Export as the required MP4 file name

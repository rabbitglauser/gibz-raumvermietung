# Testing

## Current Status

The repository contains focused backend pytest tests for reservation creation and validation. Manual testing is still used for Docker Compose startup and MongoDB persistence.

The current implemented application surface is small:

- Frontend starter page with backend health display.
- Backend health endpoints.
- Reservation creation endpoint with core reservation form fields.
- Reservation listing endpoint.
- MongoDB persistence through Docker Compose.

Planned features such as room catalogue, staff login, dashboard filters, edit deadlines, reminders, and DAO-level tests are not yet implemented and therefore cannot be tested as working features yet.

## Automated Backend Tests

The backend tests live in `backend/tests/`.

Install development test dependencies:

```bash
cd backend
pip install -r requirements-dev.txt
```

Run tests:

```bash
pytest
```

Current automated coverage:

- Successful `POST /reservations` creation returns `201`, `id`, `status: pending`, timestamps, and saved confirmation data.
- Invalid email returns `422`.
- Non-positive `attendee_count` returns `422`.
- Invalid `organizer_type` returns `422`.
- `terms_accepted: false` returns `422`.
- Invalid time order returns `422`.
- Invalid room IDs return `422`.
- Overlapping reservations for the same room/date/time return `409`.
- `GET /reservations` returns typed `items`.
- Room-specific capacity/equipment rules return `422`.

## Manual Test Plan

### Docker Compose Startup

1. Start the stack:

   ```bash
   docker compose up --build
   ```

2. Verify that all services start:

   ```bash
   docker compose ps
   ```

3. Expected services:

   - `room-rental-mongodb`
   - `room-rental-backend`
   - `room-rental-frontend`

### Frontend Health Display

1. Open `http://localhost:3000`.
2. Verify that the page title `Room Rental` is visible.
3. Verify that the backend health JSON is displayed.
4. Expected response content includes:

   ```json
   {
     "status": "ok",
     "service": "room-rental-api"
   }
   ```

### Backend Health Endpoint

Call:

```bash
curl http://localhost:8000/health
```

Expected result:

```json
{
  "status": "ok",
  "service": "room-rental-api"
}
```

Also verify that the OpenAPI documentation loads at:

```text
http://localhost:8000/docs
```

### Create Reservation

Create a reservation through the API:

```bash
curl -X POST http://localhost:8000/reservations ^
  -H "Content-Type: application/json" ^
  -d "{\"event_name\":\"M165 Project Presentation\",\"date\":\"2026-06-15\",\"setup_start_time\":\"08:30\",\"start_time\":\"09:00\",\"end_time\":\"12:00\",\"room\":\"aula-1-005\",\"attendee_count\":120,\"organizer_type\":\"gibz_internal_school_event\",\"contact\":{\"name\":\"Test User\",\"email\":\"test@example.com\",\"phone\":\"+41 41 123 45 67\",\"department\":\"Informatik\"},\"billing_address\":{\"name\":\"GIBZ Test Company\",\"street\":\"Industriestrasse 52\",\"postal_code_city\":\"6300 Zug\",\"invoice_note\":\"Use project cost center\"},\"catering\":{\"needed\":true,\"before_event\":{\"enabled\":true,\"from_time\":\"08:30\",\"to_time\":\"09:00\"}},\"setup\":{\"seating_type\":\"theater\",\"equipment\":[{\"type\":\"projector\",\"quantity\":1}],\"microphone_needed\":true,\"technical_support_hours\":1.5,\"regie_hours\":1.0},\"publication\":{\"info_screen_text\":\"M165 Project Presentation\",\"publish_on_info_screen\":true,\"publish_target_groups\":[\"students\",\"teachers\"]},\"remarks\":\"Manual API test\",\"terms_accepted\":true}"
```

Expected behavior:

- Response contains an `id`.
- Response contains `status: pending`.
- Response contains the submitted reservation fields.
- Response contains `created_at` and `updated_at` timestamps.

### List Reservations

Call:

```bash
curl http://localhost:8000/reservations
```

Expected behavior:

- Response is a JSON array.
- The reservation created in the previous test appears in the list.
- Newer reservations appear first because the backend sorts by `created_at` descending.

### Validation

Send invalid email data:

```bash
curl -X POST http://localhost:8000/reservations ^
  -H "Content-Type: application/json" ^
  -d "{\"event_name\":\"M165 Project Presentation\",\"date\":\"2026-06-15\",\"setup_start_time\":\"08:30\",\"start_time\":\"09:00\",\"end_time\":\"12:00\",\"room\":\"aula-1-005\",\"attendee_count\":120,\"organizer_type\":\"gibz_internal_school_event\",\"contact\":{\"name\":\"Test User\",\"email\":\"not-an-email\",\"phone\":\"+41 41 123 45 67\"},\"billing_address\":{\"name\":\"GIBZ Test Company\",\"street\":\"Industriestrasse 52\",\"postal_code_city\":\"6300 Zug\"},\"setup\":{\"seating_type\":\"theater\",\"equipment\":[{\"type\":\"projector\",\"quantity\":1}],\"microphone_needed\":true,\"technical_support_hours\":1.5,\"regie_hours\":1.0},\"terms_accepted\":true}"
```

Expected behavior:

- FastAPI returns a validation error.
- The status code is `422 Unprocessable Entity`.

Send an invalid time order:

```bash
curl -X POST http://localhost:8000/reservations ^
  -H "Content-Type: application/json" ^
  -d "{\"event_name\":\"M165 Project Presentation\",\"date\":\"2026-06-15\",\"setup_start_time\":\"09:30\",\"start_time\":\"09:00\",\"end_time\":\"12:00\",\"room\":\"aula-1-005\",\"attendee_count\":120,\"organizer_type\":\"gibz_internal_school_event\",\"contact\":{\"name\":\"Test User\",\"email\":\"test@example.com\",\"phone\":\"+41 41 123 45 67\"},\"billing_address\":{\"name\":\"GIBZ Test Company\",\"street\":\"Industriestrasse 52\",\"postal_code_city\":\"6300 Zug\"},\"setup\":{\"seating_type\":\"theater\",\"equipment\":[{\"type\":\"projector\",\"quantity\":1}],\"microphone_needed\":true,\"technical_support_hours\":1.5,\"regie_hours\":1.0},\"terms_accepted\":true}"
```

Expected behavior:

- FastAPI returns a validation error.
- The status code is `422 Unprocessable Entity`.

Other validation cases that should return `422`:

- `attendee_count` is `0` or negative.
- `room` is not one of `seminarraum-5-003-004`, `seminarraum-2-112`, or `aula-1-005`.
- `organizer_type` is not one of the explicit organizer category values.
- `terms_accepted` is `false`.
- Required text fields are empty.

## Persistence Test

1. Create at least one reservation.
2. Stop the stack without deleting volumes:

   ```bash
   docker compose down
   ```

3. Start the stack again:

   ```bash
   docker compose up --build
   ```

4. Call:

   ```bash
   curl http://localhost:8000/reservations
   ```

Expected behavior:

- The previously created reservation still exists because MongoDB uses the named Docker volume `mongodb_data`.

To intentionally delete all database data:

```bash
docker compose down -v
```

## Planned Automated Tests

The next implementation step should expand automated tests for the rest of the current API before adding larger features.

Recommended first tests:

- `GET /health` returns `200` and `status: ok`.
- `POST /reservations` accepts valid reservation data.
- `POST /reservations` rejects invalid email data.
- `POST /reservations` rejects empty/invalid `room`.
- `POST /reservations` rejects overlap conflicts.
- `POST /reservations` rejects unsupported room capacity/equipment combinations.
- `GET /reservations` returns created reservations.

Recommended future tests after feature implementation:

- Reservation conflict detection rejects overlapping bookings for the same room.
- Adjacent bookings for the same room are allowed.
- Customer edit token grants access only to one reservation.
- Edit deadline blocks customer updates after the configured deadline.
- Staff login protects staff-only endpoints.
- Staff filters return correct reservations for date ranges, catering, upcoming events, and past events.
- Reminder logic identifies incomplete reservations within the configured reminder window.
- DAO methods can be tested independently from route handlers.

## Test Data

Current manual tests can use simple reservation payloads such as:

```json
{
  "event_name": "M165 Project Presentation",
  "date": "2026-06-15",
  "setup_start_time": "08:30",
  "start_time": "09:00",
  "end_time": "12:00",
  "room": "aula-1-005",
  "attendee_count": 42,
  "organizer_type": "gibz_internal_school_event",
  "contact": {
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+41 41 123 45 67"
  },
  "billing_address": {
    "name": "GIBZ Test Company",
    "street": "Industriestrasse 52",
    "postal_code_city": "6300 Zug"
  },
  "setup": {
    "seating_type": "theater",
    "equipment": [{"type": "projector", "quantity": 1}],
    "microphone_needed": true,
    "technical_support_hours": 1.5,
    "regie_hours": 1.0
  },
  "terms_accepted": true
}
```

When automated tests are added, they should use a separate database name such as `room_rental_test` so development data is not modified.

## Known Test Gaps

- Automated tests currently focus on `POST /reservations` and `GET /reservations`.
- No frontend interaction tests exist yet.
- Date and time formats plus setup/start/end ordering are validated, but reservation conflict detection is not implemented yet.
- Reservation conflict detection is not implemented yet.
- Staff authentication and authorization are not implemented yet.
- Reminder behavior is not implemented yet.
- DAO tests are not possible yet because the DAO layer is not implemented.

# Testing

## Current Status

The repository does not currently contain an automated test suite. Testing is therefore manual and API-based at this stage.

The current implemented application surface is small:

- Frontend starter page with backend health display.
- Backend health endpoints.
- Reservation creation endpoint.
- Reservation listing endpoint.
- MongoDB persistence through Docker Compose.

Planned features such as room catalogue, staff login, dashboard filters, edit deadlines, reminders, and DAO-level tests are not yet implemented and therefore cannot be tested as working features yet.

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
  -d "{\"room_id\":\"aula-1005\",\"contact_name\":\"Test User\",\"contact_email\":\"test@example.com\",\"date\":\"2026-06-15\",\"start_time\":\"09:00\",\"end_time\":\"12:00\",\"notes\":\"Manual API test\"}"
```

Expected behavior:

- Response contains an `id`.
- Response contains the submitted reservation fields.
- Response contains a `created_at` timestamp.

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
  -d "{\"room_id\":\"aula-1005\",\"contact_name\":\"Test User\",\"contact_email\":\"not-an-email\",\"date\":\"2026-06-15\",\"start_time\":\"09:00\",\"end_time\":\"12:00\"}"
```

Expected behavior:

- FastAPI returns a validation error.
- The status code is `422 Unprocessable Entity`.

Send an empty `room_id`:

```bash
curl -X POST http://localhost:8000/reservations ^
  -H "Content-Type: application/json" ^
  -d "{\"room_id\":\"\",\"contact_name\":\"Test User\",\"contact_email\":\"test@example.com\",\"date\":\"2026-06-15\",\"start_time\":\"09:00\",\"end_time\":\"12:00\"}"
```

Expected behavior:

- FastAPI returns a validation error.
- The status code is `422 Unprocessable Entity`.

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

The next implementation step should add automated tests for the current API before adding larger features.

Recommended first tests:

- `GET /health` returns `200` and `status: ok`.
- `POST /reservations` accepts valid reservation data.
- `POST /reservations` rejects invalid email data.
- `POST /reservations` rejects empty `room_id`.
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
  "room_id": "aula-1005",
  "contact_name": "Test User",
  "contact_email": "test@example.com",
  "date": "2026-06-15",
  "start_time": "09:00",
  "end_time": "12:00",
  "notes": "Manual API test"
}
```

When automated tests are added, they should use a separate database name such as `room_rental_test` so development data is not modified.

## Known Test Gaps

- No automated tests exist yet.
- No frontend interaction tests exist yet.
- Date and time logic is not fully validated yet.
- Reservation conflict detection is not implemented yet.
- Staff authentication and authorization are not implemented yet.
- Reminder behavior is not implemented yet.
- DAO tests are not possible yet because the DAO layer is not implemented.

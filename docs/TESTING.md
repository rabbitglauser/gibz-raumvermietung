# Testing

## Testing Goals

- Verify that core workflows (reservation creation, editing, staff management) function correctly
- Catch regressions when adding new features
- Validate business rules (conflict detection, edit deadlines, required fields)
- Ensure the API returns correct responses and meaningful error messages
- Confirm the application runs end-to-end via Docker Compose

## Testing Strategy

The project uses a practical mix of automated and manual tests, weighted toward the areas with the highest risk: API correctness, business logic, and reservation conflicts.

| Level | Scope | Tools | Priority |
|---|---|---|---|
| Unit tests | Individual functions, DAO methods, validators | pytest | High |
| Integration tests | API endpoints with a real MongoDB instance | pytest + httpx (TestClient) | High |
| API tests | Full request/response validation | pytest + httpx | High |
| Manual UI tests | Frontend workflows, visual verification | Browser | Medium |

## Test Levels

### Unit Tests

Unit tests cover isolated logic that does not require a database or HTTP server.

**What to test:**
- Pydantic model validation (valid and invalid inputs)
- Business logic functions (deadline calculation, conflict detection)
- Utility functions (token generation, date formatting)
- DAO methods (with a test MongoDB instance)

**Framework:** pytest with async support (`pytest-asyncio`).

**Location:** `backend/tests/unit/`

**Example:**

```python
def test_reservation_create_rejects_missing_email():
    with pytest.raises(ValidationError):
        ReservationCreate(
            room_id="room-1",
            contact_name="Test User",
            contact_email="not-an-email",
            date="2026-05-01",
            start_time="09:00",
            end_time="12:00",
        )
```

### Integration Tests

Integration tests run against a real MongoDB instance (either local or in Docker) to verify that the API endpoints work correctly with the database.

**What to test:**
- Creating a reservation and verifying it appears in the database
- Listing reservations with and without filters
- Updating a reservation via edit token
- Deleting a reservation as staff
- Conflict detection when creating overlapping reservations

**Framework:** pytest with FastAPI's `TestClient` (or `httpx.AsyncClient`).

**Location:** `backend/tests/integration/`

**Database setup:** Use a separate test database (`room_rental_test`) that is cleared before each test run. This avoids interfering with development data.

### API Tests

API tests validate the HTTP interface: correct status codes, response shapes, error messages, and headers.

**What to test:**
- `POST /reservations` returns 201 with valid data and 422 with invalid data
- `GET /reservations` returns a list sorted by creation date
- `GET /reservations/{token}` returns 404 for unknown tokens
- `PUT /reservations/{token}` rejects edits after the deadline (403)
- `POST /auth/login` returns a JWT cookie on success and 401 on failure
- Health endpoint returns 200

**Location:** `backend/tests/api/`

### Manual UI Tests

Manual tests cover frontend workflows that are difficult to automate without a browser testing framework. These are documented as checklists to ensure consistent coverage during testing sessions.

**When to run:** Before each demo, after major frontend changes, and before submission.

## Critical Test Scenarios

### Reservation Conflict Tests

- [ ] Creating two reservations for the same room at the same time is rejected
- [ ] Creating a reservation that partially overlaps with an existing one is rejected
- [ ] Creating a reservation for the same room at a different time succeeds
- [ ] Creating a reservation for a different room at the same time succeeds
- [ ] Creating a reservation immediately after an existing one ends succeeds (adjacent, not overlapping)

### Validation Tests

- [ ] Reservation with empty `contact_name` is rejected (422)
- [ ] Reservation with invalid email format is rejected (422)
- [ ] Reservation with `end_time` before `start_time` is rejected
- [ ] Reservation with missing required fields returns clear error messages
- [ ] Room ID that does not exist is rejected

### Edit Deadline Tests

- [ ] Customer can edit a reservation before the deadline
- [ ] Customer cannot edit a reservation after the deadline (403 with clear message)
- [ ] Staff can edit a reservation regardless of the deadline
- [ ] The edit deadline is calculated correctly based on the configured number of days

### Reminder Tests

- [ ] Reservations with missing catering/setup info within the reminder window are identified
- [ ] A reminder is sent for eligible reservations
- [ ] A reservation that already received a reminder does not get a second one
- [ ] Reservations with complete information are not flagged for reminders
- [ ] Reservations in the past are not flagged for reminders

### Role and Authorization Tests

- [ ] Unauthenticated requests to staff endpoints return 401
- [ ] Staff login with correct credentials returns a JWT
- [ ] Staff login with incorrect credentials returns 401
- [ ] Expired JWT tokens are rejected
- [ ] Edit token grants access only to the associated reservation, not others
- [ ] Invalid edit tokens return 404

## Test Data Strategy

**Development data:**
- A seed script (`backend/scripts/seed.py`, planned) populates the database with sample rooms, reservations, and staff accounts for development and demos
- Sample data should cover various scenarios: upcoming events, past events, reservations with and without catering, reservations near their edit deadline

**Test data:**
- Each test creates its own data and cleans up afterward (or uses a fresh test database)
- Avoid relying on shared test fixtures that create hidden dependencies between tests
- Use factory functions to generate test reservation documents with sensible defaults

**Staff test accounts (for manual testing):**

| Username | Role | Password |
|---|---|---|
| `admin` | admin | `admin123` |
| `sekretariat` | secretariat | `test123` |
| `hausdienst` | hausdienst | `test123` |
| `treff` | restaurant_treff | `test123` |

These are for development and testing only — production passwords must be changed.

## Manual Test Checklist

### Room Catalogue

- [ ] Landing page loads and shows a list of rooms
- [ ] Clicking a room shows its detail page with capacity, setup variants, and description
- [ ] Room detail page shows a reservation form

### Reservation Creation

- [ ] Filling out the form with valid data creates a reservation
- [ ] The user sees a confirmation with their edit link
- [ ] Submitting with missing required fields shows validation errors
- [ ] Submitting with an invalid email shows a validation error
- [ ] Attempting to book an already-occupied time slot shows a conflict error

### Reservation Editing (Customer)

- [ ] Opening the edit link shows the reservation details
- [ ] Customer can update catering, setup variant, and materials
- [ ] Saving changes persists them (reload the page to verify)
- [ ] Attempting to edit after the deadline shows a clear message
- [ ] Using an invalid token shows a "not found" page

### Staff Dashboard

- [ ] Staff login page loads
- [ ] Logging in with valid credentials redirects to the dashboard
- [ ] Logging in with invalid credentials shows an error
- [ ] Dashboard shows all reservations
- [ ] Date range filter works correctly
- [ ] Catering filter shows only reservations with catering
- [ ] Upcoming filter shows only future events
- [ ] Past filter shows only past events
- [ ] Clicking a reservation shows its details
- [ ] Staff can edit any reservation
- [ ] Staff can delete a reservation (with confirmation)
- [ ] Logging out returns to the login page

### Docker Compose

- [ ] `docker compose up --build` starts all three services without errors
- [ ] Frontend is accessible at http://localhost:3000
- [ ] Backend health check responds at http://localhost:8000/health
- [ ] Swagger docs load at http://localhost:8000/docs
- [ ] Creating a reservation through the frontend stores it in MongoDB
- [ ] Stopping and restarting Docker Compose preserves existing data
- [ ] `docker compose down -v` clears all data

## Testing with Docker Compose

To run the full stack for manual or integration testing:

```bash
# Start all services
docker compose up --build

# In another terminal, run backend tests against the Dockerized MongoDB
cd backend
source .venv/bin/activate
MONGODB_URL=mongodb://localhost:27017 MONGODB_DB=room_rental_test pytest

# Or run tests inside the backend container
docker exec room-rental-backend pytest
```

For isolated test runs, start only MongoDB:

```bash
docker compose up mongodb -d
cd backend
MONGODB_URL=mongodb://localhost:27017 MONGODB_DB=room_rental_test pytest
```

## Bug Tracking

Bugs and issues are tracked in the project's GitHub Issues. Each bug report should include:

- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment (Docker vs. local, browser, OS)
- Severity (critical, major, minor)

## Exit Criteria

The application is considered ready for submission when:

1. All MVP features from [SCOPE.md](SCOPE.md) are implemented and functional
2. All critical test scenarios pass (conflict detection, edit deadlines, authorization)
3. The manual test checklist has been completed with no critical or major issues remaining
4. The application starts and runs correctly via `docker compose up`
5. API endpoints return correct status codes and response formats
6. Staff authentication works (login, protected routes, logout)
7. Customer edit access works (token-based access, deadline enforcement)
8. MongoDB backup and restore has been tested at least once
9. Documentation is complete and aligned with the implementation

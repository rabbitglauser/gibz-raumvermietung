# Backend tests

Pytest suite covering the core booking logic. No real MongoDB instance is
required — `conftest.py` stubs `app.db` so every test runs in-process
against an in-memory fake collection (see `MockReservationsCollection`
in `test_reservations.py`).

Latest result:

```bash
pytest -q
# 58 passed, 1 warning
```

## Running

From the repository root:

```bash
pip install -r backend/requirements.txt -r backend/requirements-dev.txt
pytest
```

`pytest.ini` at the repo root sets `pythonpath = backend` and
`testpaths = backend/tests`, so `pytest` with no arguments picks up the
whole suite.

## Test report for documentation

Generate a JUnit XML report (consumable by most CI / docs tooling):

```bash
pytest --junitxml=backend/tests/report.xml
```

For a human-readable summary:

```bash
pytest -v
```

## Coverage

| Area                              | File                       | Status   |
| --------------------------------- | -------------------------- | -------- |
| Health & root endpoints           | `test_health.py`           | active   |
| Reservation creation (happy path) | `test_reservations.py`     | active   |
| Invalid input handling            | `test_reservations.py`     | active   |
| Time-order validation             | `test_reservations.py`     | active   |
| Room capacity / equipment rules   | `test_reservations.py`     | active   |
| Double-booking prevention         | `test_reservations.py`     | active   |
| Adjacent-booking allowed          | `test_reservations.py`     | active   |
| Listing reservations              | `test_reservations.py`     | active   |
| Reservation filters               | `test_reservations.py`     | active   |
| Structured validation errors      | `test_validation_errors.py`| active   |
| Edit deadline behavior            | `test_edit_deadline.py`    | active   |
| Staff auth routes                 | `test_auth_routes.py`      | active   |
| Staff-protected routes            | `test_staff_routes.py`     | active   |

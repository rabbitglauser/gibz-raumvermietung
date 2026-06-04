# Backend tests

Pytest suite covering the core booking logic. No real MongoDB instance is
required — `conftest.py` stubs `app.db` so every test runs in-process
against an in-memory fake collection (see `MockReservationsCollection`
in `test_reservations.py`).

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
| Staff filters (catering/search)   | `test_reservations.py`     | active   |
| Public availability (no PII)      | `test_reservations.py`     | active   |
| Staff status update / delete      | `test_reservations.py`     | active   |
| DAO / service unit tests          | `test_dao.py`              | active   |
| Room catalogue                    | `test_rooms.py`            | active   |
| Edit deadline behavior            | `test_edit_deadline.py`    | active   |
| Staff auth + role gating          | `test_staff_routes.py`     | active   |
| Reminder selection / send-once    | `test_reminders.py`        | active   |

All suites are active. `test_edit_deadline.py` and `test_staff_routes.py` were
previously module-skipped placeholders; the edit-token routes and staff-auth
layer now exist, so they exercise real behavior. The fake collections in
`mocks.py` support dotted paths (`catering.needed`), `$or`, and the
`$ne/$in/$gte/$lte/$regex` operators used by the new filters.

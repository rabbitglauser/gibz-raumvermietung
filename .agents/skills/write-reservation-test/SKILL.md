---
name: write-reservation-test
description: Use when writing a pytest test that touches the reservations API. Tests must use the in-memory MockReservationsCollection — never a real Mongo connection — and must respect the adjacent-booking regression invariant.
---

# Write a reservations test

## When to use

- Adding a test under `backend/tests/`
- Writing a regression test for a reservation bug
- Adding coverage for a new route or validator
- Touching `test_reservations.py`, `test_edit_deadline.py`, or `test_staff_routes.py`

## Required setup (already in place)

Tests **must not** import `app.routers.reservations` before the fake `app.db` module is installed. `backend/tests/conftest.py` and the top of `test_reservations.py` already do this — don't move those imports.

## Steps

1. **Use the existing fixtures.** `mock_collection` (line 86) gives you the in-memory collection; `client` (line 93) gives you a `TestClient` already wired to it. Take `client` (and `mock_collection` if you need to seed or inspect documents) as fixture args.
2. **Build payloads via `valid_payload()`** (line 98). Override only the fields under test:

   ```python
   def test_my_case(client):
       payload = valid_payload()
       payload["attendee_count"] = 9999
       response = client.post("/reservations", json=payload)
       assert response.status_code == 422
   ```

3. **Pre-seed conflicts by inserting into `mock_collection.documents` directly** (it's a `list[dict]`). Don't go through the API for setup unless you're testing the create flow itself.
4. **Status-code expectations.** 201 = success, 409 = booking conflict, 422 = validation error. There is no 400.
5. **Adjacent bookings must NOT conflict.** A reservation ending at `10:00` and another starting at `10:00` in the same room is allowed. There's already a regression test for this — don't break it.
6. **If your query uses a new Mongo operator**, you ALSO need the `extend-mock-query` skill — `matches_operator` will raise `AssertionError` otherwise.
7. **Run** `pytest` from the repo root. `pytest.ini` already sets `pythonpath = backend` and `testpaths = backend/tests` — no flags needed.

## Why this matters

AGENTS.md: *"Tests never touch real Mongo. … `MockReservationsCollection` is a hand-rolled in-memory collection with a tiny query interpreter."* The mock + import-order setup is fragile; following the established pattern is the only way to get reliable, fast tests.

## Reference

- Mock + fixtures: `backend/tests/test_reservations.py:41-95`
- Payload builder: `backend/tests/test_reservations.py:98`
- Adjacent-booking regression: search for `test_adjacent` in `test_reservations.py`
- Skipped placeholders to un-skip when routes land: `backend/tests/test_edit_deadline.py`, `backend/tests/test_staff_routes.py`

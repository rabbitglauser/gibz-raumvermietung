---
name: extend-mock-query
description: Use when adding a new MongoDB query operator ($eq, $in, $regex, $or, etc.) to a query in the FastAPI backend. The test suite uses a hand-rolled in-memory mock that must be extended in lockstep, otherwise tests silently pass with incorrect filtering.
---

# Extend the in-memory Mongo mock

## When to use

- Writing a new query in `backend/app/routers/` that uses a Mongo operator (`$in`, `$or`, `$eq`, `$ne`, `$regex`, `$exists`, …)
- Test failures with `AssertionError: Unsupported fake Mongo operator: $...`
- Any change to `has_reservation_conflict` or new query helpers in routers

## Steps

1. **Identify the operator** used in the new query (the production code in `backend/app/routers/reservations.py` — e.g. `has_reservation_conflict` at line 295).
2. **Open `backend/tests/test_reservations.py`** and find `matches_operator` (line 76). Currently supports `$nin`, `$lt`, `$gt`.
3. **Add a new branch** matching the existing style:

   ```python
   if operator == "$in":
       return actual in expected
   ```

4. **For compound operators** (`$or`, `$and`) extend `matches_query` / `matches_condition` (lines 66–73), not just `matches_operator`. These take a list of sub-queries.
5. **Add a regression test** that exercises the new operator path through a real route call — don't just unit-test the helper.
6. **Run `pytest`** from the repo root (no args needed, `pytest.ini` configures pythonpath/testpaths).

## Why this matters

CLAUDE.md, Architecture notes: *"`MockReservationsCollection` … is a hand-rolled in-memory collection with a tiny query interpreter (`$nin`, `$lt`, `$gt`) — extend `matches_operator` if you add a new Mongo operator to a query."* The mock will raise `AssertionError` on unknown operators, but ONLY if the query actually reaches it. Conditional code paths can hide an unsupported operator in CI for weeks.

## Reference

- Mock collection: `backend/tests/test_reservations.py:41-64`
- Query interpreter: `backend/tests/test_reservations.py:66-83`
- Real query example: `backend/app/routers/reservations.py:295-303` (uses `$nin`, `$lt`, `$gt`)

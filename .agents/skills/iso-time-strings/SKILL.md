---
name: iso-time-strings
description: Use when serializing, querying, or comparing date/time values in the reservation system. Storage and queries use zero-padded ISO strings — lexicographic comparison only works because of the padding. Breaking that invariant silently corrupts conflict detection.
---

# ISO time-string handling in reservations

## When to use

- Adding any query that filters on `date`, `setup_start_time`, `start_time`, `end_time`
- Serializing a `datetime.time` / `datetime.date` for Mongo
- Debugging "conflict detection returns wrong results" or "ordering is off"
- Touching `has_reservation_conflict` or any sort by a time field

## The invariant

MongoDB has no native `time` type. This codebase stores times and dates as strings:

- **Times** → `"HH:MM"` zero-padded (so `"08:30"` not `"8:30"`)
- **Dates** → `"YYYY-MM-DD"` zero-padded (so `"2026-06-15"`)

The conflict query uses `$lt` / `$gt` directly on these strings. **Lexicographic string comparison only matches numeric ordering when both sides are zero-padded to the same width.** `"9:00" > "10:00"` is `True` (wrong); `"09:00" > "10:00"` is `False` (correct).

## Steps

1. **Always serialize via** `.isoformat()` on the typed `time` / `date` (Python guarantees zero-padding for `time` and `date`). Example: `payload.end_time.isoformat()`.
2. **For whole-document writes**, use `payload.model_dump(mode="json")` — this is what `create_reservation` does at line 315. `mode="json"` triggers ISO serialization for `time` and `date` fields.
3. **Never** hand-format times with `f"{hour}:{minute}"` or `str(time_value)` — both can drop leading zeros.
4. **In tests**, payload time fields are JSON strings (already zero-padded in `valid_payload()`); when seeding `mock_collection.documents` directly, match that format exactly.
5. **Adjacent bookings**: `setup_start_time < new.end_time` AND `end_time > new.setup_start_time`. Strict `<` / `>` (not `<=` / `>=`) is intentional — a reservation ending at `10:00` and another starting at `10:00` must NOT conflict. There's a regression test for this.

## Why this matters

AGENTS.md, Architecture notes: *"Times/dates are serialized via `payload.model_dump(mode='json')` so they hit Mongo as ISO strings — the conflict query relies on lexicographic comparison of those strings, which only works because they are zero-padded `HH:MM` / `YYYY-MM-DD`."* Get the padding wrong and double-bookings silently slip through.

## Reference

- Conflict query: `backend/app/routers/reservations.py:295-303`
- Document write: `backend/app/routers/reservations.py:315` (`model_dump(mode="json")`)
- Test payload (correct format): `backend/tests/test_reservations.py:98` onward

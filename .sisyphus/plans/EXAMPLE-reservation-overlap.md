# Plan: lock in reservation conflict-detection invariants

## Context

`has_reservation_conflict` in `backend/app/routers/reservations.py` uses overlap semantics
`setup_start_time < new.end_time AND end_time > new.setup_start_time`, scoped by room + date.

Two behaviors people frequently try to "fix" but are intentional:

1. **Adjacent bookings are allowed** — one reservation ending at `12:30` and another starting at `12:30` in the same room is *not* a conflict. Without an explicit test pinning this, somebody will eventually tighten the comparison to `<=` and break booking flow.
2. **Times are stored as zero-padded ISO strings**, not `datetime.time` objects. The conflict query depends on lexicographic comparison of those strings, which only works because of the padding (`09:00`, not `9:00`).

This plan exists so future "cleanup" PRs that touch this area trip a guardrail.

## Tasks

### 1. Adjacent same-room bookings return 201 — INTENTIONAL

Verify `test_create_reservation_allows_adjacent_same_room_booking` in `backend/tests/test_reservations.py` passes. This test creates one reservation ending at `12:00` and a second one starting at `12:00`, both in the same room on the same date — expects both to succeed (201).

Evidence: `task-1-adjacent-booking-allowed.txt`.

### 2. Overlapping same-room bookings return 409

Counterpart to task 1: create a reservation `10:00–12:00`, then attempt one `11:00–13:00` — second should return 409. Confirms the overlap detector still flags real overlaps.

Evidence: `task-2-overlap-rejected.txt`.

### 3. Time strings are zero-padded in storage

Spot-check that a payload with `"start_time": "09:00"` is persisted exactly as `"09:00"` (not `"9:00"`), so lexicographic comparison continues to work. Inspect the `mock_collection` contents after a POST.

Evidence: `task-3-zero-padded-times.txt`.

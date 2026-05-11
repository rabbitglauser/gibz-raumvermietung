---
name: add-room
description: Use when adding a new room (or new SeatingType / EquipmentType value) to the GIBZ reservation system. Ensures changes flow through the centralized ROOM_RULES table and the RoomId enum instead of ad-hoc handler checks.
---

# Add a room (or seating / equipment value)

## When to use

- "Add a new room", "add a fourth room", "support room X"
- "Add a new seating type" / "add a new equipment type"
- Any change to per-room capacity, allowed seating, allowed equipment, microphone or technical-support eligibility

## Steps

1. **Add the enum value first.** Edit `backend/app/routers/reservations.py`:
   - For a new room: add a member to `RoomId` (around line 13). Use `kebab-case` string value, e.g. `seminarraum_3_201 = "seminarraum-3-201"`.
   - For a new seating type: add to `SeatingType` (around line 34).
   - For a new equipment type: add to `EquipmentType` (around line 43).
2. **Extend `ROOM_RULES`** (around line 54) with an entry for the new room. Required keys: `capacity` (int), `seating_types` (set of `SeatingType`), `equipment` (set of `EquipmentType`), `microphone` (bool), `technical_support` (bool).
3. **Do NOT add `if room == ...` branches in route handlers or helper functions.** All per-room logic must flow through `validate_room_rules()` (line 147) and the four `validate_room_*` helpers (lines 114–144). Regie-hours is the only existing room-specific check and it lives in `validate_room_services` — extend that helper, don't add new ones at the route level.
4. **Add tests** in `backend/tests/test_reservations.py`: at least one passing case and one capacity / seating / equipment rejection case (expect 422). Use the `valid_payload()` builder.

## Why this matters

AGENTS.md, Conventions: *"Don't bypass `ROOM_RULES` — adding ad-hoc `if room == ...` checks in handlers fragments the rule surface."* The whole point of `ROOM_RULES` is that adding a room is a single-table edit. Spreading room logic across handlers makes future rooms exponentially harder to add.

## Reference

- Rule table: `backend/app/routers/reservations.py:54-111`
- Validation entrypoint: `backend/app/routers/reservations.py:147-152`
- Per-rule helpers: `backend/app/routers/reservations.py:114-144`
- Existing test patterns: `backend/tests/test_reservations.py` (`valid_payload`, capacity tests)

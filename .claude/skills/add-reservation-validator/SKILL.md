---
name: add-reservation-validator
description: Use when adding a cross-field business rule to reservations (time ordering, catering rules, organizer-type constraints, etc.). Validators belong on the pydantic model, not in route handlers — this preserves the 422 vs 400 contract and keeps handlers thin.
---

# Add a reservation business-rule validator

## When to use

- "Add a rule that …" involving more than one field on a reservation
- Cross-field checks (date+time, organizer+room, capacity+seating, …)
- Conditional required-fields ("if X then Y must be set")

Do NOT use this for single-field validation that pydantic already covers (`min_length`, `gt=0`, `EmailStr`) — keep those as `Field(...)` constraints.

## Steps

1. **Locate the right model.** Cross-field rules on the reservation as a whole live on `ReservationCreate` (`backend/app/routers/reservations.py:225`). Catering rules live on `CateringInfo` / `CateringWindow`. Add the validator to whichever model owns *all* the fields involved.
2. **Use `@model_validator(mode="after")`** — this runs after individual field validation, so all fields are already typed. Existing example: `validate_business_rules` at line 249.
3. **Raise `ValueError`** (not `HTTPException`). FastAPI converts it to HTTP 422. Example:

   ```python
   @model_validator(mode="after")
   def validate_my_rule(self) -> "ReservationCreate":
       if self.attendee_count > 100 and self.organizer_type == OrganizerType.external_customer:
           raise ValueError("external customers cannot book events over 100 attendees")
       return self
   ```

4. **Don't add the same check in the route handler.** Routes return 201/409 only. Status codes by layer:
   - 422 → pydantic validation (this is where business rules go)
   - 409 → conflict detection (`has_reservation_conflict`)
   - 201 → success
5. **Test the validator** by POSTing an invalid payload and asserting `response.status_code == 422`. See existing time-ordering tests for shape.

## Why this matters

CLAUDE.md, Architecture notes: *"Cross-field validation lives in pydantic `model_validator(mode='after')`, not in the route. … Invalid input therefore returns 422 from FastAPI's request-validation layer, not 400 from the handler."* Putting business rules in handlers fragments the validation surface and breaks the status-code contract that the frontend relies on.

## Reference

- Whole-reservation rules: `backend/app/routers/reservations.py:249-257`
- Catering self-validation: `backend/app/routers/reservations.py:174-203`
- Per-field validator example: `backend/app/routers/reservations.py:242-247` (`terms_accepted`)

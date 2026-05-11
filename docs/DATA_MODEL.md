# Data Model

MongoDB schema for the room-rental backend. Mirrors the Pydantic models
in `backend/app/models/` and the JSON Schema validators in
`database/init/01-collections.js`.

## Layering

```
routers/  → services/  → dao/  → MongoDB
              ↑
           models/  (Pydantic + business validators)
```

- **routers** define HTTP endpoints. They call services, never the DAO
  or Mongo directly.
- **services** orchestrate (e.g. conflict check before insert) and map
  raw documents to API response shapes.
- **dao** wraps a single Mongo collection. Constructors take the
  database object so a fake can be injected in tests.
- **models** hold Pydantic models, enums, and the `ROOM_RULES` table.
  Business validation lives here, not in handlers.

## Collections

### `rooms`

Static catalogue of bookable rooms. Read-mostly.

```json
{
  "_id": "<ObjectId>",
  "room_id": "aula-1-005",
  "sort_order": 1,
  "name": "Aula 1.005",
  "room_number": "1.005",
  "building": "Trakt 1",
  "floor": "Erdgeschoss",
  "area_m2": 415,
  "location": "Trakt 1, Erdgeschoss",
  "description": "Aula für Veranstaltungen, Konzerte, Seminare und Prüfungen mit fix installierter Bühne und AV-Technik.",
  "capacity": 330,
  "seating_types": ["theater", "seminar", "u_shape", "exam"],
  "equipment": ["projector", "flipchart", "pinboard", "laptop", "lectern", "stage"],
  "microphone": true,
  "technical_support": true,
  "inspection_contact": { "name": "Hausdienst", "email": "hausdienst.gibz@zg.ch", "phone": "+41 41 594 77 60" },
  "fixed_setup": ["Bühne (8 m x 3 m, 17 cm hoch)", "Leinwand (2.5 m x 4.5 m)"],
  "seating_options": [
    { "type": "theater", "label": "Konzertbestuhlung", "max_people": 330 },
    { "type": "seminar", "label": "Seminarbestuhlung", "max_tables": 61, "table_size": "80 x 180 cm" }
  ],
  "pricing": [
    { "organizer_type": "external_customer", "label": "Externe Kundin / Externer Kunde", "half_day_chf": 980, "full_day_chf": 1420 }
  ],
  "catering": { "required": true, "provider": "Restaurant Treff" },
  "reservation": { "send_to_email": "sekretariat.gibz@zg.ch", "catering_send_to_email": "treff.gibz@zfv.ch" }
}
```

The full seed contains the real room catalogue for Aula 1.005,
Seminarraum 2.112, and Seminarraum 5.003/004, including seating variants,
additional material, microphones, catering notes, and reservation contacts.

Indexes: `room_id` unique, `sort_order` ascending.

### `reservations`

A reservation is stored as a single nested document containing every
field the booking form captures: contact info, billing address,
catering windows, setup (seating + equipment list + service hours), and
publication info. Statuses: `pending` (default on create), `confirmed`,
`rejected`, `cancelled`.

```json
{
  "_id": "<ObjectId>",
  "event_name": "M165 Project Presentation",
  "date": "2026-06-15",
  "setup_start_time": "08:30",
  "start_time": "09:00",
  "end_time": "12:00",
  "room": "aula-1-005",
  "attendee_count": 120,
  "organizer_type": "gibz_internal_school_event",
  "contact": {
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+41 41 123 45 67",
    "department": "Informatik"
  },
  "billing_address": {
    "name": "GIBZ",
    "street": "Industriestrasse 52",
    "postal_code_city": "6300 Zug",
    "invoice_note": null
  },
  "catering": {
    "needed": true,
    "before_event": { "enabled": true, "from_time": "08:30", "to_time": "09:00" },
    "during_event": { "enabled": false, "from_time": null, "to_time": null },
    "after_event":  { "enabled": false, "from_time": null, "to_time": null }
  },
  "setup": {
    "seating_type": "theater",
    "equipment": [
      { "type": "projector", "quantity": 1 },
      { "type": "lectern",   "quantity": 1 }
    ],
    "microphone_needed": true,
    "technical_support_hours": 1.5,
    "regie_hours": 1.0
  },
  "publication": { "info_screen_text": "...", "publish_on_info_screen": true, "publish_target_groups": ["students"] },
  "remarks": null,
  "terms_accepted": true,
  "status": "pending",
  "created_at": "<Date>",
  "updated_at": "<Date>"
}
```

Indexes:

- `{ room: 1, date: 1, status: 1 }` — drives conflict detection.
- `{ created_at: -1 }` — list endpoint sort.
- `{ "contact.email": 1 }` — staff lookups by requester.

#### Time fields are zero-padded ISO strings

`date` is `YYYY-MM-DD`, the three time fields are `HH:MM`. They are
stored as strings, not BSON dates/times. Conflict detection relies on
lexicographic comparison matching chronological comparison, which is
only true because the strings are zero-padded. Do not change the
serialization.

### `users` (staff)

Login records for staff and admins. Authentication endpoints are not
implemented yet; this collection plus its index reserve the shape so
that adding auth later is a straight-forward task.

```json
{
  "_id": "<ObjectId>",
  "username": "j.doe",
  "password_hash": "<argon2/bcrypt>",
  "role": "staff",
  "name": "Jane Doe",
  "email": "jane@gibz.ch",
  "created_at": "<Date>"
}
```

Indexes: `username` unique.

## Why nested reservation documents fit MongoDB

- A reservation is an aggregate: contact info, billing address,
  catering windows, and setup are only meaningful in the context of one
  booking. They are written and read together, so embedding avoids
  joins and matches the document-store sweet spot.
- Reservations have low cardinality on related entities (one contact,
  one billing address, ≤ a handful of equipment line items), so the
  16 MB document size limit is never near.
- The conflict query is a single-collection scan over a selective
  compound index — no `$lookup` needed.
- Rooms are referenced by `room_id` (a stable enum value), not by
  ObjectId. This keeps reservations independent of the rooms collection
  layout and lets the validator service evolve `ROOM_RULES` in code.

## Configuration

Connection settings come from environment variables:

- `MONGODB_URL` (default `mongodb://localhost:27017`)
- `MONGODB_DB`  (default `room_rental`)

Read by `app/config.py` and consumed in `app/db.py`. The shared
`AsyncMongoClient` is created once at import time; route handlers
acquire the database via the `get_database` FastAPI dependency, which
makes test injection trivial.

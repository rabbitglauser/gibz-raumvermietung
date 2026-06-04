# Database Design

The application uses **MongoDB 8** (a document-oriented NoSQL database), accessed
asynchronously through `pymongo.AsyncMongoClient`. All access is funnelled through
the **DAO layer** (`backend/app/dao/`) so the rest of the app never touches the
driver directly.

## Why MongoDB / document design

A reservation is a self-contained aggregate: scheduling, contact, billing,
catering, setup, and publication details all belong to one booking and are
read/written together. Embedding them in a single document (rather than spreading
them across joined tables) matches the access pattern and keeps reads to a single
lookup. The flexible schema also let the model grow (edit tokens, reminder flags)
without migrations. See [DECISION.md](DECISION.md) ADR-3.

## Collections

Database: `room_rental` (configurable via `MONGODB_DB`).

| Collection     | Purpose                                   | Key fields |
|----------------|-------------------------------------------|------------|
| `reservations` | Customer bookings (the core aggregate)    | `_id`, `edit_token`, `room`, `date`, times, `status`, `reminder_sent` |
| `rooms`        | Room catalogue (capacity, equipment, pricing, seating options, images) | `room_id`, `sort_order` |
| `users`        | Staff accounts for the dashboard          | `username`, `password_hash`, `role` |

### `reservations` document shape

```jsonc
{
  "_id": ObjectId,
  "event_name": "M165 Project Presentation",
  "date": "2026-06-15",              // ISO date string (zero-padded)
  "setup_start_time": "08:30:00",    // ISO time string (zero-padded)
  "start_time": "09:00:00",
  "end_time": "12:00:00",
  "room": "aula-1-005",
  "attendee_count": 120,
  "organizer_type": "gibz_internal_school_event",
  "contact":         { "name": "...", "email": "...", "phone": "...", "department": "..." },
  "billing_address": { "name": "...", "street": "...", "postal_code_city": "...", "invoice_note": "..." },
  "catering": {
    "needed": true,
    "before_event": { "enabled": true, "from_time": "08:30:00", "to_time": "09:00:00" },
    "during_event": { "enabled": false, "from_time": null, "to_time": null },
    "after_event":  { "enabled": false, "from_time": null, "to_time": null }
  },
  "setup": {
    "seating_type": "theater",
    "equipment": [ { "type": "projector", "quantity": 1 } ],
    "microphone_needed": true,
    "technical_support_hours": 1.5,
    "regie_hours": 1.0
  },
  "publication": { "info_screen_text": "...", "publish_on_info_screen": true, "publish_target_groups": ["students"] },
  "remarks": "...",
  "terms_accepted": true,

  // server-managed
  "status": "pending",               // pending | confirmed | rejected | cancelled
  "edit_token": "<secrets.token_urlsafe(32)>",   // customer edit access
  "reminder_sent": false,            // ensures at most one reminder
  "created_at": ISODate,
  "updated_at": ISODate
}
```

### ISO-string time invariant

Dates and times are stored as **zero-padded ISO strings**, not native BSON dates.
Conflict detection and date-range filters rely on **lexicographic** comparison
(`$lt`/`$gt`/`$gte`/`$lte`), which equals chronological order only because the
strings are zero-padded (`HH:MM:SS`, `YYYY-MM-DD`). Breaking the padding silently
corrupts overlap detection. See ADR notes and `iso-time-strings` skill.

## Indexes

Defined in `database/init/02-indexes.js` (applied on first container start):

- `reservations`: compound `(room, date, status)` for conflict/availability
  queries; `date` for the management list / reminder range filters;
  `edit_token` (unique, sparse) for customer edit lookups; `created_at`;
  `contact.email`.
- `users`: unique `username`.
- `rooms`: unique `room_id`, plus `sort_order` for catalogue ordering.

## Representative queries

**Conflict detection** (`ReservationDAO.has_conflict`) — overlap with strict
bounds so adjacent bookings are allowed:

```js
db.reservations.findOne({
  room: "aula-1-005",
  date: "2026-06-15",
  status: { $nin: ["cancelled", "rejected"] },
  setup_start_time: { $lt: "12:00:00" },
  end_time:         { $gt: "08:30:00" }
})
```

**Staff filter** (`GET /reservations?has_catering=true&q=...`):

```js
db.reservations.find({
  "catering.needed": true,
  $or: [
    { event_name:    { $regex: "m165", $options: "i" } },
    { "contact.name": { $regex: "m165", $options: "i" } },
    { room:          { $regex: "m165", $options: "i" } }
  ]
}).sort({ date: 1 })
```

**Reminder candidates** (`ReservationDAO.list_pending_reminders`):

```js
db.reservations.find({
  reminder_sent: { $ne: true },
  date: { $lte: "2026-06-20" },          // today + reminder_window_days
  status: { $nin: ["cancelled", "rejected"] }
})
// completeness (catering window / seating) is then decided in Python
```

## Backup & restore

Manual `mongodump` / `mongorestore` against the named volume `mongodb_data` — see
[DEPLOYMENT.md](DEPLOYMENT.md#mongodb-backup-and-restore).

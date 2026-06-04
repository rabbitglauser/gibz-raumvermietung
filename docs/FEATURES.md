# Features

> **Note:** An earlier draft of this file described a student/teacher booking
> concept (student approval workflow, `GIB000000` IDs, shared calendar, semester
> bookings). That concept was **superseded** by the room-rental scope defined in
> [M165ANFORDERUNGPROJEKT.md](M165ANFORDERUNGPROJEKT.md), [PRD.md](PRD.md), and
> [SCOPE.md](SCOPE.md). The list below reflects what is actually implemented.

## Customer

- **Room catalogue** — browse all rooms with capacity, location, equipment,
  seating variants, pricing, and images (`/raeume`, `/raeume/{roomId}`).
- **Self-service reservation** — book a room via a multi-step form (date/time,
  room, organizer, contact, billing, catering, setup, publication).
- **Conflict prevention** — overlapping bookings for the same room/date/time are
  rejected (`409`); adjacent bookings (one ends as another starts) are allowed.
- **Server-side validation** — required fields, email format, time ordering, and
  per-room rules (capacity, allowed seating/equipment, microphone, technical
  support, regie) are enforced at the model layer (`422` on violation).
- **Edit link (no account)** — each reservation returns a secure `edit_token`;
  the customer completes/changes catering, setup, and remarks at
  `/reservation/edit/?token=…` until a configurable deadline before the event.

## Staff

- **Login** — username/password, bcrypt-hashed, JWT in an HTTP-only cookie.
- **Dashboard** (`/dashboard`) — list all reservations with filters:
  date range, catering required, upcoming, past, status, and free-text search
  (name / room / event).
- **Manage** — view detail, change status (pending → confirmed/rejected/
  cancelled), and edit fields. Rescheduling re-checks for conflicts.
- **Delete** — admin-only ("higher-authority override").
- **Roles** — `staff`, `secretariat`, `hausdienst`, `restaurant_treff`, `admin`.

## Automation

- **Reminders** — an optional scheduled job emails customers whose event is
  within a configurable window and whose catering/setup details are still
  incomplete, including their edit link. Each reservation is reminded at most
  once (`reminder_sent` flag). Degrades gracefully without SMTP.

## Platform

- **DAO layer** decoupling all MongoDB access; **NoSQL document model** with
  schema validators and indexes.
- **Configurable** edit deadline, reminder window, and connection/auth/SMTP
  settings via environment variables (no hardcoding).
- **Docker Compose** one-command startup; **backup/restore** documented.
- **Public availability endpoint** exposing only booked slots (no customer data)
  so the booking calendar never leaks PII.

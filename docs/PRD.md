# Product Requirements Document

## Product Overview

The GIBZ Room Rental application is a web-based system for managing room reservations at GIBZ (Gewerblich-Industrielles Bildungszentrum Zug). It replaces the existing PDF-based reservation process with an online workflow that allows customers to browse rooms, create reservations, and complete event details. Staff members use a dashboard to manage all reservations with filtering and CRUD capabilities.

The application is built as a Module 165 (NoSQL Databases) school project using Next.js, FastAPI, and MongoDB.

## Problem Statement

The current room reservation process relies on PDF forms that customers fill out and submit manually. This approach has several drawbacks:

- Customers cannot see real-time room availability before submitting a reservation
- PDF forms must be processed manually by staff, which is slow and error-prone
- There is no central overview of all reservations — staff must track them through email and file systems
- Customers often forget to provide catering, setup, or material details before their event
- There is no automated way to remind customers about missing information
- Filtering or searching reservations (e.g., by date range or catering needs) requires manual effort

## Goals

1. Allow customers to view available rooms and their setup options online
2. Enable customers to create reservations through a web form
3. Let customers edit their reservation details (catering, setup, materials) until a configurable deadline before the event
4. Provide staff with a centralized dashboard to view, filter, and manage all reservations
5. Automatically remind customers to complete missing information before their event
6. Store all reservation data in a structured, queryable database
7. Make the system easy to deploy and demonstrate via Docker Compose

## Non-Goals

- Real-time calendar synchronization with external systems (Outlook, Google Calendar)
- Online payment processing
- Multi-language support (the application will be in English; German UI may be added later)
- Mobile-native applications (the web app should be responsive but not a native app)
- Complex approval workflows with multi-step sign-off chains
- Integration with existing GIBZ IT systems beyond what is documented here

## User Groups

### Customer

External or internal users who want to reserve a room for an event. They interact with the public-facing part of the application: browsing rooms, creating reservations, and editing their reservation details via a secure edit link.

### Secretariat

Administrative staff who handle reservation management as part of their daily work. They need a full overview of all reservations, the ability to filter by various criteria, and CRUD access to reservation data.

### Facility Management / Hausdienst

Staff responsible for room setup, equipment, and physical preparation. They need to see upcoming reservations with their setup variant and material requirements to plan their work.

### Restaurant Treff

The on-site catering provider. They need to see reservations that include catering requests, along with the specific requirements, to prepare food and beverage services.

### IT / Admin Support

Technical staff who deploy and maintain the application. They manage staff accounts, system configuration, and database backups. This role interacts with the system primarily through configuration and the command line rather than the web UI.

## Key Workflows

### 1. Customer Creates a Reservation

1. Customer visits the room catalogue and browses available rooms
2. Customer selects a room and views its details (capacity, setup options, equipment)
3. Customer fills out the reservation form (date, time, contact info, optional notes)
4. System validates the reservation (no time conflicts, required fields present)
5. System creates the reservation and generates a secure edit token
6. Customer receives a confirmation with an edit link to complete additional details later

### 2. Customer Edits a Reservation

1. Customer opens the edit link (containing the secure token)
2. System verifies the token and checks the edit deadline
3. Customer updates catering, setup variant, materials, or other details
4. System saves the changes
5. If the edit deadline has passed, the system rejects changes with a clear message

### 3. Staff Manages Reservations

1. Staff member logs in to the dashboard
2. Dashboard shows all reservations with filters (date range, catering, upcoming, past)
3. Staff can view reservation details, edit any field, or cancel a reservation
4. Changes are saved immediately

### 4. Reminder for Missing Information

1. A scheduled backend task checks for upcoming reservations with incomplete details
2. If a reservation is within the reminder window and missing catering, setup, or material info, the system sends an email reminder to the customer
3. The reminder includes the edit link so the customer can complete the information
4. The system records that a reminder was sent to avoid duplicates

## Functional Requirements

### Room Catalogue

- FR-1: Display a list of all available rooms with basic information (name, capacity, location)
- FR-2: Show room detail pages with setup variants, equipment lists, and photos
- FR-3: Room data is managed in the database and can be updated by staff

### Reservation Management

- FR-4: Customers can create a reservation by selecting a room, date, time, and providing contact information
- FR-5: The system prevents double-bookings for the same room and overlapping time slots
- FR-6: Each reservation gets a unique, secure edit token for customer access
- FR-7: Customers can edit their reservation through the edit link until the configurable edit deadline
- FR-8: Staff can view, create, edit, and delete any reservation through the dashboard
- FR-9: Reservations include optional fields for catering, setup variant, and materials that can be filled in later

### Staff Dashboard

- FR-10: Staff can filter reservations by date range
- FR-11: Staff can filter reservations by catering requirement (has catering / no catering)
- FR-12: Staff can filter for upcoming events (events in the future)
- FR-13: Staff can filter for past events
- FR-14: Staff can search reservations by contact name or room
- FR-15: The dashboard shows a summary view and allows drilling into individual reservations

### Authentication

- FR-16: Staff members log in with username and password
- FR-17: Staff accounts have roles (secretariat, hausdienst, restaurant_treff, admin)
- FR-18: All authenticated staff can view and manage reservations
- FR-19: Customer access is through secure edit tokens — no account required

### Reminders

- FR-20: The system sends email reminders to customers with incomplete reservation details
- FR-21: Reminders are sent a configurable number of days before the event
- FR-22: Each reservation receives at most one reminder (tracked with a flag)

### Configuration

- FR-23: The edit deadline (days before event) is configurable
- FR-24: The reminder window (days before event) is configurable
- FR-25: Application settings are managed through environment variables and/or a database configuration collection

## Non-Functional Requirements

- **NFR-1: Usability** — The reservation form should be completable in under 3 minutes. The staff dashboard should load within 2 seconds.
- **NFR-2: Reliability** — The application should handle concurrent reservations without data corruption. Conflict detection must be accurate.
- **NFR-3: Security** — Edit tokens must be cryptographically random and long enough to prevent guessing. Staff passwords must be hashed. JWT tokens must be stored in HTTP-only cookies.
- **NFR-4: Maintainability** — The codebase should follow a clear structure (routers, DAOs, services) that separates concerns.
- **NFR-5: Portability** — The application must run on any machine with Docker installed, without platform-specific dependencies.
- **NFR-6: Data integrity** — MongoDB data must be persisted in a named volume. Backup and restore procedures must be documented.

## Success Criteria

1. A customer can create a reservation and later edit it via the edit link
2. Staff can log in and use the dashboard to view and filter reservations
3. The system prevents double-bookings for the same room and time
4. Reminders are sent for reservations with missing information
5. The entire application starts with `docker compose up`
6. All major features are documented and testable
7. The project demonstrates effective use of MongoDB as a NoSQL database (document design, queries, aggregation)

## Risks and Assumptions

### Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Time constraints limit feature completion | Some planned features may not be implemented | Clearly separate MVP from stretch goals in [SCOPE.md](SCOPE.md) |
| Email delivery for reminders requires SMTP setup | Reminders may not work without a mail server | Document the setup; test with a local SMTP tool (e.g., MailHog) |
| MongoDB performance with concurrent writes | Reservation conflicts could occur under load | Use MongoDB transactions or atomic update operations for conflict checks |

### Assumptions

- The application will serve a small number of concurrent users (school setting, not high-traffic production)
- Room data (names, capacities, setup variants) is relatively static and changes infrequently
- Staff accounts are created manually or seeded — there is no self-registration
- The system does not need to integrate with existing GIBZ calendar or booking systems
- Email reminders are a best-effort feature — customers are ultimately responsible for completing their reservation details

## Future Enhancements

These features are out of scope for the current project but could be added later:

- Calendar view for room availability (visual timeline)
- PDF export of reservation details for printing
- Multi-language support (German, English)
- Integration with external calendar systems
- Recurring reservations
- Audit log for staff actions
- Customer notification preferences (email frequency, opt-out)
- Room availability API for third-party integrations

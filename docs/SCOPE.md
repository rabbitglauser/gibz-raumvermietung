# Project Scope

## In-Scope Features

### Must-Have (MVP)

These features are required for the project to be considered complete and demonstrable.

**Room Catalogue**
- Public listing of all available rooms
- Room detail pages with capacity, location, and setup variants
- Room data stored in MongoDB

**Reservation Creation**
- Web form for creating a reservation (room, date, time, contact info)
- Server-side validation (required fields, email format, time logic)
- Conflict detection — prevent overlapping reservations for the same room
- Reservation stored in MongoDB with a generated edit token

**Reservation Editing**
- Customer edit access via secure token link
- Edit catering, setup variant, materials, and notes
- Configurable edit deadline — edits rejected after the deadline
- Clear feedback when the deadline has passed

**Staff Dashboard**
- Staff login with username and password
- View all reservations in a list/table
- Filter by date range
- Filter by catering requirement
- Filter for upcoming events
- Filter for past events
- CRUD operations on reservations (create, read, update, delete)

**Backend API**
- RESTful endpoints for rooms, reservations, and authentication
- Pydantic request/response validation
- DAO layer for database access
- Health check endpoint

**Database**
- MongoDB with collections for reservations, rooms, staff, and configuration
- Named Docker volume for data persistence
- Documented backup and restore procedure

**Docker Compose**
- Three-service setup (frontend, backend, MongoDB)
- Single-command startup (`docker compose up`)
- Environment variable configuration

### Should-Have

These features strengthen the project but are not strictly required for the core workflow.

**Reminders**
- Scheduled backend task to check for incomplete reservations
- Email notification to customers with missing catering/setup/material info
- Configurable reminder window (days before event)
- Tracking to prevent duplicate reminders

**Staff Roles**
- Role field on staff accounts (secretariat, hausdienst, restaurant_treff, admin)
- All roles can access the dashboard (role-specific permissions are a stretch goal)

**Reservation Status**
- Status field on reservations (pending, confirmed, completed, cancelled)
- Staff can change status from the dashboard

### Nice-to-Have (Stretch Goals)

These features go beyond the project requirements and would only be implemented if time allows.

- Role-based permission differences (e.g., Restaurant Treff sees only catering-relevant reservations)
- Search reservations by contact name or room name
- Pagination on the staff dashboard
- Reservation detail print view
- Dark mode for the frontend
- API rate limiting
- MongoDB aggregation pipeline for dashboard statistics (e.g., reservations per month)
- Seed script to populate rooms and sample reservations for demos

## Out-of-Scope Features

These features are explicitly excluded from this project.

- Online payment processing
- Integration with external calendar systems (Outlook, Google Calendar)
- Native mobile applications
- Multi-language / internationalization (i18n)
- Real-time notifications (WebSocket-based live updates)
- Multi-tenancy (support for multiple organizations)
- Complex approval workflows with multi-step sign-off
- Kubernetes or cloud-native deployment
- Automated CI/CD pipeline
- Load testing or performance optimization beyond reasonable response times
- User analytics or tracking
- File upload for room images (images can be served as static assets)

## Technical Scope

### Included

- Next.js 16 frontend with React 19, TypeScript, Tailwind CSS 4
- FastAPI backend with Python 3.12, Pydantic, PyMongo (async)
- MongoDB 8 database
- Docker Compose orchestration
- RESTful API design
- JWT-based staff authentication
- Token-based customer edit access
- DAO / repository pattern for data access
- Environment-based configuration with Pydantic Settings
- Manual MongoDB backup/restore via `mongodump` / `mongorestore`

### Excluded

- ORM or ODM libraries (Beanie, MongoEngine) — plain PyMongo with DAO classes
- GraphQL — REST is simpler and sufficient
- Server-side rendering for all pages — only where it benefits performance (room catalogue)
- Automated database migrations — MongoDB's flexible schema makes these unnecessary for this scale
- SSL/TLS termination — handled by a reverse proxy in production, not by the application itself

## Constraints

- **Timeline:** This is a school project with a fixed submission deadline. Feature scope must be realistic.
- **Team size:** Small team — architecture and tooling choices must keep complexity low.
- **Module requirements:** Must use a NoSQL database (MongoDB) and demonstrate understanding of document-oriented design.
- **Infrastructure:** No dedicated hosting. The application must run on a developer's machine or a single demo server via Docker Compose.

## Dependencies

| Dependency | Version | Purpose |
|---|---|---|
| Next.js | 16.2 | Frontend framework |
| React | 19.2 | UI library |
| Tailwind CSS | 4.x | Styling |
| FastAPI | 0.135 | Backend framework |
| Pydantic | 2.12 | Validation and settings |
| PyMongo | 4.16 | MongoDB driver (async) |
| MongoDB | 8.x | Database |
| Docker / Docker Compose | v24+ / v2+ | Containerization |
| Uvicorn | 0.44 | ASGI server |

## Assumptions

- The number of concurrent users will be small (under 50 at any given time)
- Room data changes infrequently and can be managed manually or via seed scripts
- Staff accounts are pre-created — there is no self-registration flow
- The application will be demonstrated on `localhost` or a local network; public internet deployment is not required
- Email sending for reminders depends on SMTP configuration that may not be available in all environments — the feature should degrade gracefully if SMTP is not configured
- The project will be evaluated on functionality, code quality, documentation, and appropriate use of MongoDB — not on visual design polish

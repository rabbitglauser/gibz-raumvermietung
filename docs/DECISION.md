# Technical Decisions

This document records the major technical decisions made for the GIBZ Room Rental project, structured as lightweight Architecture Decision Records (ADRs).

---

## ADR-1: Next.js for Frontend

**Decision:** Use Next.js with React and TypeScript as the frontend framework.

**Context:** The frontend needs to render a public room catalogue, reservation forms, and a staff dashboard. It should support both server-rendered pages (for SEO and fast initial load of the room catalogue) and interactive client-side features (for forms and dashboards).

**Chosen option:** Next.js 16 with React 19, TypeScript, and Tailwind CSS 4.

**Alternatives considered:**
- **Plain React (Vite):** Would work for a single-page app but lacks built-in server-side rendering, routing conventions, and API route support. More manual setup needed.
- **Angular:** Heavier framework with a steeper learning curve. Overkill for this project's scope.
- **Vue / Nuxt:** Viable alternative, but Next.js has broader adoption and better aligns with existing team experience.

**Consequences:**
- Server components enable efficient data fetching for the room catalogue
- File-based routing simplifies page structure
- Tailwind CSS provides utility-first styling without writing custom CSS files
- TypeScript catches type errors at build time
- The team needs familiarity with React and Next.js conventions

---

## ADR-2: FastAPI for Backend

**Decision:** Use FastAPI with Python as the backend framework.

**Context:** The backend must expose a REST API for reservation management, handle authentication, enforce business rules (conflict detection, edit deadlines), and run scheduled tasks (reminders). It should be straightforward to develop and test.

**Chosen option:** FastAPI with Python 3.12, Pydantic for validation, and Uvicorn as the ASGI server.

**Alternatives considered:**
- **Express.js (Node):** Would allow a single language across the stack, but Python was preferred for this project's context (Module 165 curriculum, team familiarity).
- **Django + DRF:** More opinionated and includes an ORM designed for relational databases. The ORM does not map well to MongoDB. FastAPI is lighter and more flexible.
- **Flask:** Simpler but lacks built-in async support, automatic API documentation, and type-based validation that FastAPI provides out of the box.

**Consequences:**
- Automatic OpenAPI/Swagger documentation at `/docs`
- Pydantic models provide request/response validation with clear error messages
- Native async support for non-blocking database operations
- Lightweight and fast to develop with
- Smaller ecosystem compared to Django, but sufficient for this scope

---

## ADR-3: MongoDB as NoSQL Database

**Decision:** Use MongoDB as the primary database.

**Context:** The project is part of Module 165 (NoSQL Databases), so a NoSQL database is required. Reservation data has a natural document structure — each reservation is a self-contained unit with nested details (catering, setup, materials). The schema may evolve as features are added.

**Chosen option:** MongoDB 8, accessed via PyMongo (async driver).

**Alternatives considered:**
- **PostgreSQL with JSONB:** Provides document-like flexibility within a relational database, but does not satisfy the NoSQL requirement of the module.
- **CouchDB:** Document-oriented but less widely adopted, fewer learning resources, and weaker Python driver support.
- **Redis:** Key-value store, not suited for the query patterns needed (filtering by date range, catering, status).

**Consequences:**
- Flexible schema allows incremental field additions without migrations
- Document model fits reservation data naturally
- Powerful query and aggregation capabilities for staff filters
- No joins — related data should be embedded or referenced deliberately
- The team needs to understand document design patterns (embedding vs. referencing)

---

## ADR-4: Docker Compose for Orchestration

**Decision:** Use Docker Compose to run all services locally and for demo deployment.

**Context:** The application consists of three services (frontend, backend, database). Running them manually with separate terminals and local installs is error-prone and hard to reproduce. A consistent development environment is needed.

**Chosen option:** Docker Compose with three services defined in a single `docker-compose.yml`.

**Alternatives considered:**
- **Manual local setup:** Requires installing Python, Node.js, and MongoDB separately. Works but is not reproducible across machines.
- **Kubernetes:** Far too complex for a student project. No need for scaling, rolling deployments, or service mesh.
- **Podman Compose:** Compatible alternative, but Docker has wider tooling support and documentation.

**Consequences:**
- Single command (`docker compose up`) starts the entire stack
- Consistent environment across all team members
- Named volumes persist MongoDB data between restarts
- Service dependencies are declared explicitly
- Developers can still run services individually for faster iteration during development

---

## ADR-5: Modular Monolith over Microservices

**Decision:** Build the backend as a single FastAPI application with clear module boundaries instead of separate microservices.

**Context:** The application has a small, well-defined feature set (rooms, reservations, reminders, staff management). The team is small and the project timeline is limited.

**Chosen option:** Modular monolith — one FastAPI app with separate routers, DAOs, and service modules.

**Alternatives considered:**
- **Microservices:** Separate services for rooms, reservations, reminders, and auth. Would require inter-service communication, service discovery, and separate deployments.
- **Serverless functions:** Individual cloud functions per endpoint. Adds cold-start latency, vendor lock-in, and deployment complexity.

**Consequences:**
- Simpler development, testing, and deployment
- No inter-service communication overhead
- Single database connection shared across all modules
- All code lives in one repository (already the case)
- If needed, modules can be extracted into services later thanks to the DAO/router separation
- The monolith must stay well-organized to avoid becoming a tangled mess — the module structure enforces this

---

## ADR-6: DAO / Repository Layer

**Decision:** Abstract all database access behind DAO (Data Access Object) classes.

**Context:** The initial implementation puts database queries directly in route handlers. As the application grows, this mixes HTTP concerns with data access, making it harder to test and maintain.

**Chosen option:** A DAO layer where each MongoDB collection has a corresponding class that encapsulates all queries.

**Alternatives considered:**
- **Direct database access in routers:** Simpler initially (and the current state), but leads to duplicated queries and tightly coupled code.
- **ODM (e.g., Beanie, MongoEngine):** Object-Document Mappers add abstraction but also add a dependency and learning curve. For this project's complexity, plain PyMongo with DAO classes provides enough structure.

**Consequences:**
- Route handlers stay focused on HTTP logic
- Database queries are reusable and testable in isolation
- Easier to mock the DAO layer in unit tests
- Slight overhead of maintaining DAO classes, but manageable for the number of collections involved
- Refactoring from the current direct-access pattern requires moving existing queries into DAO classes

---

## ADR-7: Staff Auth and Customer Edit Access

**Decision:** Use JWT-based login for staff and token-based edit links for customers.

**Context:** Staff members need persistent authenticated sessions to manage reservations. Customers need to edit their reservation details (catering, setup, materials) before the event but should not be forced to create an account for a one-time room booking.

**Chosen option:**
- **Staff:** Username/password login with bcrypt-hashed passwords. JWT tokens in HTTP-only cookies.
- **Customers:** Secure random edit token generated per reservation, included in an edit link sent to the customer's email. The token grants access to view and modify that specific reservation until the edit deadline.

**Alternatives considered:**
- **OAuth / SSO:** Adds significant complexity. Not needed for a small set of known staff users.
- **Customer accounts:** Requires registration, password recovery, and session management for users who may only book a room once. Disproportionate effort.
- **Magic links (email-based login):** Similar to the edit token approach but implies a full session. The edit token is simpler because it only grants access to one resource.

**Consequences:**
- Staff auth is straightforward to implement with FastAPI's dependency injection
- Customer edit access requires no account creation — lower friction for one-time users
- Edit tokens must be securely generated (e.g., `secrets.token_urlsafe`) and long enough to prevent guessing
- Tokens are single-resource: compromising one token exposes only that reservation, not the entire system
- The edit deadline adds a time limit, reducing the window of exposure
- Staff accounts must be seeded or created by an admin — there is no self-registration for staff

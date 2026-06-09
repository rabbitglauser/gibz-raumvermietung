<h1 align="center">
  <img
    src="https://github.com/user-attachments/assets/070048c2-46a3-45c7-8dea-92b34890dcb0"
    alt="Raumvermietung"
    width="200"
  />
  <br/>
  Project Trace — Raumvermietung
</h1>


<p align="center">
  Datenbank mt NoSQL<br/>
  made at the <strong>GIBZ for M165 2026</strong>.
</p>

<p align="center">
  <a href="https://rabbitglauser.github.io/gibz-raumvermietung/raeume/"><img src="https://img.shields.io/badge/Live-Demo.com-9eca45?style=for-the-badge" alt="Live Demo"/></a>
  <a href="https://github.com/rabbitglauser/gibz-raumvermietung/tree/main/docs"><img src="https://img.shields.io/badge/Docs-Architektur-003a5d?style=for-the-badge" alt="Docs"/></a>
  <a href="https://www.figma.com/design/dU7SgQ4GXlvGvDLVR3grMB/Untitled?node-id=0-1&p=f"><img src="https://img.shields.io/badge/Figma-Mockup-F24E1E?style=for-the-badge&logo=figma&logoColor=white" alt="Figma"/></a>
  <a href="https://www.notion.so/Cassandra-333e987f6a44807686f0f6a995211171?source=copy_link"><img src="https://img.shields.io/badge/Notion-Documentation-000000?style=for-the-badge&logo=notion&logoColor=white" alt="Notion"/></a>
</p>

# GIBZ Raumvermietung

Web application for the GIBZ room reservation project in Module 165, using a Next.js frontend, FastAPI backend, and MongoDB as the NoSQL database.

The project replaces the PDF-based room reservation workflow with an API-backed web application. The current implementation focuses on the backend reservation API and the Dockerized project setup.

# Links for the website

users: https://rabbitglauser.github.io/gibz-raumvermietung/raeume/

admin: https://rabbitglauser.github.io/gibz-raumvermietung/staff/

admin login

staff



## Current Features

- Docker Compose setup for MongoDB, backend, and frontend.
- FastAPI backend with OpenAPI/Swagger documentation.
- MongoDB persistence for reservation documents.
- MongoDB-seeded room catalogue for the three real GIBZ rental rooms.
- Room catalogue and room detail pages for Aula 1.005, Seminarraum 2.112, and Seminarraum 5.003/004.
- Structured `POST /reservations` endpoint with nested request models.
- Typed `GET /reservations` response.
- Reservation validation for:
  - required fields
  - valid email addresses
  - valid room IDs
  - valid organizer categories
  - accepted terms
  - time order: `setup_start_time <= start_time < end_time`
  - attendee count greater than zero
  - overlapping reservations for the same room/date/time
  - room-specific capacity, seating, equipment, microphone, technical support, and regie-hour rules
- Backend pytest coverage for the reservation API.

## Supported Rooms

The reservation API currently supports these canonical room IDs:

| Room | API value |
|---|---|
| Seminarraum 5.003/004 | `seminarraum-5-003-004` |
| Seminarraum 2.112 | `seminarraum-2-112` |
| Aula 1.005 | `aula-1-005` |

## Technology Stack

| Area | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python, Pydantic |
| Database | MongoDB |
| Containerization | Docker Compose |
| Testing | pytest, FastAPI TestClient, `unittest.mock` |

## Getting Started

### Prerequisites

- Docker v24+ and Docker Compose v2+
- Git

For local development without Docker:

- Python 3.12+
- Node.js 20+
- MongoDB 8 or a reachable MongoDB connection string

### Start with Docker Compose

From the repository root:

```bash
docker compose up --build
```

After startup:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- Health check: http://localhost:8000/health
- MongoDB: localhost:27017

Stop the stack:

```bash
docker compose down
```

Stop the stack and delete MongoDB data:

```bash
docker compose down -v
```

## Backend API

### Create Reservation

```http
POST /reservations
```

Example payload:

```json
{
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
    "name": "GIBZ Test Company",
    "street": "Industriestrasse 52",
    "postal_code_city": "6300 Zug",
    "invoice_note": "Use project cost center"
  },
  "catering": {
    "needed": true,
    "before_event": {
      "enabled": true,
      "from_time": "08:30",
      "to_time": "09:00"
    }
  },
  "setup": {
    "seating_type": "theater",
    "equipment": [
      {
        "type": "projector",
        "quantity": 1
      }
    ],
    "microphone_needed": true,
    "technical_support_hours": 1.5,
    "regie_hours": 1.0
  },
  "publication": {
    "info_screen_text": "M165 Project Presentation",
    "publish_on_info_screen": true,
    "publish_target_groups": ["students", "teachers"]
  },
  "remarks": "Please open the room 30 minutes early.",
  "terms_accepted": true
}
```

Successful responses return `201 Created` with the saved reservation, generated `id`, `status: "pending"`, `created_at`, and `updated_at`.

Overlapping reservations for the same room/date/time return `409 Conflict`.

### List Reservations

```http
GET /reservations
```

Response shape:

```json
{
  "items": []
}
```

## Running Tests

Install backend test dependencies:

```bash
cd backend
pip install -r requirements-dev.txt
```

Run tests from the repository root:

```bash
python -m pytest
```

The pytest configuration is in `pytest.ini` and sets `backend` as the Python path.

## Project Structure

```text
backend/
  app/
    main.py
    db.py
    routers/
      reservations.py
  tests/
    test_reservations.py
frontend/
  src/
docs/
docker-compose.yml
pytest.ini
```

## Documentation

Additional project documentation is available under `docs/`:

- `docs/PROJECT_DOCUMENTATION.md`
- `docs/ARCHITECTURE.md`
- `docs/TESTING.md`
- `docs/DEPLOYMENT.md`
- `docs/BACKUP_RESTORE.md`
- `docs/PRD.md`
- `docs/SCOPE.md`
- `docs/DECISION.md`

The original reservation PDFs and room setup documents are also stored under `docs/`.

## Planned Work

The following features are planned but not complete yet:

- Customer edit links and edit deadlines.
- Staff dashboard with authentication, filters, and CRUD management.
- Automatic reminders for missing catering/setup/material details.
- DAO/service layer separation for database access and business logic.
- Final PDF export of the project documentation for submission.

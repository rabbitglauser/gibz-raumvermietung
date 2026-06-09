# Deployment

## Prerequisites

To run the current application with Docker:

- Docker v24 or newer.
- Docker Compose v2 or newer.
- Git.

For local development without Docker:

- Python 3.12 or newer.
- Node.js 20 or newer.
- MongoDB 8 or another reachable MongoDB instance.

## Docker Compose Setup

The repository root contains `docker-compose.yml` with three services:

| Service | Container name | Port | Purpose |
|---|---|---|---|
| `mongodb` | `room-rental-mongodb` | `27017:27017` | MongoDB database |
| `backend` | `room-rental-backend` | `8000:8000` | FastAPI REST API |
| `frontend` | `room-rental-frontend` | `3000:3000` | Next.js frontend |

MongoDB data is stored in the named Docker volume `mongodb_data`.

## Start the Application

From the repository root:

```bash
docker compose up --build
```

To start in the background:

```bash
docker compose up --build -d
```

After startup:

| URL | Purpose |
|---|---|
| `http://localhost:3000` | Frontend |
| `http://localhost:8000` | Backend root endpoint |
| `http://localhost:8000/health` | Backend health check |
| `http://localhost:8000/docs` | Swagger / OpenAPI UI |
| `localhost:27017` | MongoDB connection from host tools |

Stop services:

```bash
docker compose down
```

Stop services and delete MongoDB data:

```bash
docker compose down -v
```

## Environment Variables

### Backend

The backend reads environment variables through Pydantic Settings in `backend/app/config.py`. Docker Compose loads `backend/.env` through `env_file`.

| Variable | Default in code | Purpose |
|---|---|---|
| `APP_NAME` | `room-rental-api` | FastAPI application name |
| `MONGODB_URL` | `mongodb://localhost:27017` | MongoDB connection string |
| `MONGODB_DB` | `room_rental` | MongoDB database name |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated allowed CORS origins |
| `EDIT_DEADLINE_DAYS` | `3` | Days before the event a customer may still edit |
| `REMINDER_WINDOW_DAYS` | `5` | Window in which incomplete reservations get reminded |
| `REMINDERS_ENABLED` | `false` | Master switch for the reminder scheduler |
| `REMINDER_INTERVAL_MINUTES` | `60` | How often the reminder job runs |
| `JWT_SECRET` | `change-me-in-production` | **Set a strong random value in production** |
| `JWT_EXPIRE_MINUTES` | `480` | Staff session lifetime |
| `AUTH_COOKIE_SECURE` | `false` | Require HTTPS for the auth cookie (enable in prod) |
| `SMTP_HOST` | *(empty)* | SMTP host for reminder emails; empty disables sending |
| `SMTP_PORT` | `1025` | SMTP port (MailHog default) |
| `SMTP_FROM` | `raumvermietung@gibz.ch` | Reminder sender address |
| `PUBLIC_BASE_URL` | `http://localhost:3000` | Base URL for edit links in reminder emails |

When the backend runs inside Docker Compose, `MONGODB_URL` should use the Docker service name:

```text
mongodb://mongodb:27017
```

### Frontend

Docker Compose sets:

| Variable | Value | Purpose |
|---|---|---|
| `API_BASE_URL` | `http://backend:8000` | Backend URL for server-side frontend requests inside Docker |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000` | Backend URL for browser/client-side requests |

The frontend API helper falls back to `http://localhost:8000` if neither variable is set.

## Local Development

Docker Compose is the recommended way to run the full application. For faster local development, services can also be started separately.

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Make sure MongoDB is reachable through `MONGODB_URL`.

To run only MongoDB through Docker:

```bash
docker compose up mongodb -d
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at:

```text
http://localhost:3000
```

## Current API Smoke Test

After starting the stack, verify the backend:

```bash
curl http://localhost:8000/health
```

Create a reservation:

```bash
curl -X POST http://localhost:8000/reservations ^
  -H "Content-Type: application/json" ^
  -d "{\"event_name\":\"M165 Project Presentation\",\"date\":\"2026-06-15\",\"setup_start_time\":\"08:30\",\"start_time\":\"09:00\",\"end_time\":\"12:00\",\"room\":\"aula-1-005\",\"attendee_count\":120,\"organizer_type\":\"gibz_internal_school_event\",\"contact\":{\"name\":\"Test User\",\"email\":\"test@example.com\",\"phone\":\"+41 41 123 45 67\"},\"billing_address\":{\"name\":\"GIBZ Test Company\",\"street\":\"Industriestrasse 52\",\"postal_code_city\":\"6300 Zug\"},\"setup\":{\"seating_type\":\"theater\",\"equipment\":[{\"type\":\"projector\",\"quantity\":1}],\"microphone_needed\":true,\"technical_support_hours\":1.5,\"regie_hours\":1.0},\"terms_accepted\":true}"
```

List reservations (staff-only — requires a login cookie):

```bash
# log in and store the session cookie, then list
curl -c cookies.txt -X POST http://localhost:8000/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"admin-secret\"}"
curl -b cookies.txt http://localhost:8000/reservations
```

## Staff Accounts

There is no self-registration. Create staff accounts with the bundled CLI
(run inside the backend container, or locally against a reachable MongoDB):

```bash
docker compose exec backend python -m app.create_staff ^
  --username admin --password admin-secret ^
  --name "Admin" --email admin@gibz.ch --role admin
```

Roles: `staff`, `secretariat`, `hausdienst`, `restaurant_treff`, `admin`. Only
`admin` may delete reservations ("higher authority override"). Staff then log in
at `http://localhost:3000/dashboard`.

## Customer Edit Links

Creating a reservation returns a one-time `edit_token`. The customer uses it at:

```text
http://localhost:3000/reservation/edit/?token=<edit_token>
```

Edits to catering, setup, and remarks are accepted until `EDIT_DEADLINE_DAYS`
before the event; afterwards the API returns `403`.

## Reminders (optional)

To demo automatic reminders, start the optional MailHog service and enable the
scheduler in `backend/.env`:

```text
REMINDERS_ENABLED=true
SMTP_HOST=mailhog
PUBLIC_BASE_URL=http://localhost:3000
```

```bash
docker compose up --build        # mailhog is included
```

The job runs every `REMINDER_INTERVAL_MINUTES`, emailing the edit link to
customers whose event is within `REMINDER_WINDOW_DAYS` and whose catering/setup
details are incomplete. Captured emails appear at `http://localhost:8025`.

## MongoDB Backup and Restore

Detailed support instructions are maintained in
[`docs/BACKUP_RESTORE.md`](BACKUP_RESTORE.md).

Create a backup from the repository root:

```powershell
.\scripts\backup-mongodb.ps1
```

Restore a selected backup:

```powershell
.\scripts\restore-mongodb.ps1 -ArchivePath .\backups\room_rental-YYYYMMDD-HHMMSS.archive.gz -ConfirmDataLoss
```

Verify the backup/restore process with sample data on a development database:

```powershell
.\scripts\verify-mongodb-restore.ps1 -ConfirmDataLoss
```

For the current school-project stage, manual backups before demos or larger
changes are sufficient. A production deployment should add scheduled backups,
credentials, off-site storage, and secure secret handling.

## Troubleshooting

### Backend cannot connect to MongoDB

- Check service status:

  ```bash
  docker compose ps
  ```

- Check MongoDB logs:

  ```bash
  docker compose logs mongodb
  ```

- Verify that Docker Compose uses `MONGODB_URL=mongodb://mongodb:27017` in `backend/.env`.

### Frontend cannot fetch backend health

- Verify backend health manually:

  ```bash
  curl http://localhost:8000/health
  ```

- Check frontend logs:

  ```bash
  docker compose logs frontend
  ```

- Check that `NEXT_PUBLIC_API_BASE_URL` points to `http://localhost:8000` for browser requests.

### Port conflicts

If ports `3000`, `8000`, or `27017` are already in use, stop the conflicting local process or change the port mapping in `docker-compose.yml`.

### Data disappeared

MongoDB data persists across normal restarts through `mongodb_data`. Data is deleted when running:

```bash
docker compose down -v
```

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

List reservations:

```bash
curl http://localhost:8000/reservations
```

## MongoDB Backup and Restore

Create a backup:

```bash
docker exec room-rental-mongodb mongodump --db room_rental --archive=/tmp/room_rental_backup.archive
docker cp room-rental-mongodb:/tmp/room_rental_backup.archive ./backups/
```

Restore a backup:

```bash
docker cp ./backups/room_rental_backup.archive room-rental-mongodb:/tmp/
docker exec room-rental-mongodb mongorestore --db room_rental --archive=/tmp/room_rental_backup.archive --drop
```

For the current school-project stage, manual backups before demos or larger changes are sufficient. A production deployment should add scheduled backups, credentials, and secure secret handling.

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

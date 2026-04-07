# Deployment

## Prerequisites

To run the application, you need:

- **Docker** (v24+) and **Docker Compose** (v2+)
- **Git** to clone the repository

For local development without Docker:

- **Python 3.12+** with pip
- **Node.js 20+** with npm
- **MongoDB 8** running locally or accessible via connection string

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `APP_NAME` | `room-rental-api` | Application identifier |
| `MONGODB_URL` | `mongodb://localhost:27017` | MongoDB connection string |
| `MONGODB_DB` | `room_rental` | Database name |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated allowed origins |

When running via Docker Compose, `MONGODB_URL` should point to the `mongodb` service name: `mongodb://mongodb:27017`.

### Frontend

| Variable | Default | Description |
|---|---|---|
| `API_BASE_URL` | — | Backend URL for server-side requests (set in Docker Compose) |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000` | Backend URL for client-side requests |

In Docker Compose, `API_BASE_URL` is set to `http://backend:8000` for internal container-to-container communication, while `NEXT_PUBLIC_API_BASE_URL` stays as `http://localhost:8000` for browser requests.

## Docker Compose Services

The `docker-compose.yml` defines three services:

| Service | Image | Port | Volume |
|---|---|---|---|
| `mongodb` | `mongo:8` | 27017 | `mongodb_data:/data/db` |
| `backend` | Built from `./backend/Dockerfile` | 8000 | — |
| `frontend` | Built from `./frontend/Dockerfile` | 3000 | — |

### Starting the Stack

```bash
# Build and start all services
docker compose up --build

# Start in the background
docker compose up --build -d

# View logs
docker compose logs -f

# Stop all services
docker compose down

# Stop and remove volumes (deletes database data)
docker compose down -v
```

After starting, the services are available at:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API docs (Swagger):** http://localhost:8000/docs
- **Health check:** http://localhost:8000/health
- **MongoDB:** localhost:27017 (accessible with MongoDB Compass or `mongosh`)

## Local Development Setup

For faster iteration during development, you can run services individually outside Docker.

### Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# or: .venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Run the server with auto-reload
uvicorn app.main:app --reload --port 8000
```

Make sure MongoDB is running locally on port 27017, or update `MONGODB_URL` in `backend/.env`.

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run the dev server
npm run dev
```

The frontend dev server runs on http://localhost:3000 with hot module replacement.

### MongoDB

If not using Docker, install MongoDB locally or use a cloud instance (MongoDB Atlas free tier). Update the `MONGODB_URL` accordingly.

```bash
# Start MongoDB with Docker only (useful when developing outside Docker)
docker compose up mongodb -d
```

## Production / Demo Deployment

For school demos or presentations, Docker Compose on a single machine is sufficient.

**Recommended approach:**

1. Clone the repository on the target machine
2. Adjust environment variables if needed (e.g., replace `localhost` with the machine's IP in `CORS_ORIGINS` and `NEXT_PUBLIC_API_BASE_URL`)
3. Run `docker compose up --build -d`
4. Access the app at the machine's IP address on port 3000

**For a more production-like setup (future work):**
- Add a reverse proxy (Nginx or Traefik) to handle HTTPS and route traffic
- Build the Next.js frontend as a production image (`npm run build` + `npm run start`)
- Set `NODE_ENV=production` for the frontend
- Add MongoDB authentication (username/password)
- Use Docker secrets or a `.env` file excluded from version control for sensitive values

## MongoDB Backup and Restore

### Backup

```bash
# Create a backup archive
docker exec room-rental-mongodb mongodump \
  --db room_rental \
  --archive=/tmp/room_rental_backup.archive

# Copy the archive to the host
docker cp room-rental-mongodb:/tmp/room_rental_backup.archive ./backups/
```

### Restore

```bash
# Copy the archive into the container
docker cp ./backups/room_rental_backup.archive room-rental-mongodb:/tmp/

# Restore (--drop replaces existing collections)
docker exec room-rental-mongodb mongorestore \
  --db room_rental \
  --archive=/tmp/room_rental_backup.archive \
  --drop
```

### Backup Strategy

For a school project, manual backups before major changes or presentations are sufficient:

- Back up before running data migrations or schema changes
- Back up before demos
- Store backups in a `backups/` directory (add to `.gitignore`)

For a production deployment, consider scheduling daily backups with a cron job or a Docker sidecar container.

## Configuration Notes

- All backend configuration is managed through environment variables via Pydantic Settings. See [ARCHITECTURE.md](ARCHITECTURE.md) for the full list.
- The frontend configuration is minimal — just the API base URL.
- Room-specific configuration (setup variants, capacity) will be stored in the MongoDB `rooms` collection, not in environment variables.
- Configurable deadlines and reminder intervals will be stored in a MongoDB `config` collection so that staff can adjust them without redeployment.

## Troubleshooting

**Backend cannot connect to MongoDB:**
- Check that the MongoDB container is running: `docker compose ps`
- Verify `MONGODB_URL` in `backend/.env` uses `mongodb://mongodb:27017` (not `localhost`) when running in Docker
- Check MongoDB logs: `docker compose logs mongodb`

**Frontend shows "Failed to fetch backend health":**
- Verify the backend is running and healthy: `curl http://localhost:8000/health`
- Check that `NEXT_PUBLIC_API_BASE_URL` is set correctly
- If running in Docker, ensure the backend container is up before the frontend starts (Docker Compose `depends_on` handles startup order but not readiness)

**Port conflicts:**
- If port 3000, 8000, or 27017 is already in use, either stop the conflicting service or change the port mapping in `docker-compose.yml`

**Docker build fails:**
- Ensure Docker has sufficient disk space
- Try `docker compose build --no-cache` for a clean rebuild

**MongoDB data is gone after restart:**
- Data persists in the `mongodb_data` named volume. It is only deleted if you run `docker compose down -v` (the `-v` flag removes volumes)

**Hot reload not working in Docker:**
- The current frontend Dockerfile runs `npm run dev` which supports hot reload, but file watching may not work reliably across Docker volume mounts on some operating systems. For the best development experience, run the frontend outside Docker.

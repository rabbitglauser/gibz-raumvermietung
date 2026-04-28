# database — MongoDB template for room_rental

Self-contained MongoDB stack for local development. Spins up MongoDB 7 plus a
Mongo Express web UI, creates the `rooms` and `reservations` collections with
JSON Schema validators, builds the indexes the backend query plan relies on,
and seeds the three rooms used by the FastAPI app.

## Layout

```
database/                    mounted at/
├── docker-compose.yml         MongoDB + Mongo Express services
├── .env.example               copy to .env to override the database name
├── init/                      mounted at /docker-entrypoint-initdb.d
│   ├── 01-collections.js      collections + JSON Schema validators
│   ├── 02-indexes.js          indexes (room+date+status, created_at, email)
│   └── 03-seed.js             imports seeds/rooms.json on first start
└── seeds/
    └── rooms.json             3 rooms matching ROOM_RULES in the backend
```

## Quick start

From the `database/` folder:

```bash
cp .env.example .env          # optional — only if you want to change the db name
docker compose up -d
```

- MongoDB → `mongodb://localhost:27017`
- Mongo Express UI → http://localhost:8081

The backend's default `MONGODB_URL=mongodb://mongodb:27017` (in `backend/.env`)
already targets this service when both run on the same Docker network. For a
host-side backend, use `mongodb://localhost:27017`.

## Re-running the init scripts

Scripts in `init/` run **only on first start** with an empty `/data/db`. To
re-seed from scratch:

```bash
docker compose down -v        # drops the mongodb-data volume
docker compose up -d
```

## Adapting the template

- **Add a collection**: append a `target.createCollection(...)` block to
  `init/01-collections.js` and any matching indexes to `02-indexes.js`.
- **Add seed data**: drop a `*.json` file in `seeds/` and import it from
  `03-seed.js` with `JSON.parse(cat("/seeds/your-file.json"))`.
- **Change the database name**: set `MONGO_INITDB_DATABASE` in `.env`.

## Notes

- Auth is intentionally disabled to match the backend's current connection
  string. To enable, add `MONGO_INITDB_ROOT_USERNAME` / `MONGO_INITDB_ROOT_PASSWORD`
  to the compose env and update `backend/.env` to
  `mongodb://<user>:<pass>@mongodb:27017/?authSource=admin`.
- The `reservations` validator uses `validationLevel: "moderate"` so existing
  documents written before the validator was attached aren't rejected on update.

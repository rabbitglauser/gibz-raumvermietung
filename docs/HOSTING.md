# Hosting the live app (GitHub Pages + Render + MongoDB Atlas)

GitHub Pages serves **only the static frontend**. For booking, the staff
dashboard, and customer edit to work on the live site, the FastAPI backend and
MongoDB must be hosted somewhere reachable over the internet. This guide uses
free tiers:

- **Frontend** → GitHub Pages (already wired via `.github/workflows/nextjs.yml`)
- **Backend** → Render (Docker web service, see [`render.yaml`](../render.yaml))
- **Database** → MongoDB Atlas (free M0 cluster)

```
Browser ── https://rabbitglauser.github.io/gibz-raumvermietung  (Pages, static)
   │  fetch (CORS + cookies)
   ▼
https://<your-service>.onrender.com  (Render, FastAPI)
   │
   ▼
mongodb+srv://…mongodb.net  (Atlas)
```

## 1. MongoDB Atlas (database)

1. Create a free account at <https://www.mongodb.com/atlas> and a **free M0 cluster**.
2. **Database Access** → add a user (username + password).
3. **Network Access** → allow `0.0.0.0/0` (Render's egress IPs are dynamic on the free plan).
4. **Connect → Drivers** → copy the SRV connection string, e.g.
   `mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

The app creates collections on first write; Pydantic still validates every
request, so the Atlas-side JSON-schema validators/indexes from
`database/init/*.js` are optional (they only auto-apply to the local Docker
Mongo). To add the indexes on Atlas, paste `database/init/02-indexes.js` into
the Atlas shell.

## 2. Render (backend)

1. Push this repo to GitHub (the `render.yaml` Blueprint is at the repo root).
2. In Render: **New → Blueprint**, select this repository. Render reads
   `render.yaml` and creates the `gibz-raumvermietung-backend` web service.
3. Set the one secret it asks for: **`MONGODB_URL`** = your Atlas SRV string.
   (All other env vars are defined in `render.yaml`; `JWT_SECRET` is generated.)
4. Deploy. Note the public URL, e.g. `https://gibz-raumvermietung-backend.onrender.com`.
   Verify: open `…/health` → `{"status":"ok"}`.

> Free Render services sleep after ~15 min idle; the first request then takes a
> few seconds to wake. Fine for a demo/screencast.

### Seed a staff account (against Atlas)

Run locally with `MONGODB_URL` pointed at Atlas (or use the Render shell):

```bash
# PowerShell
$env:MONGODB_URL="mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority"
python -m app.create_staff --username admin --password "ChangeMe123!" `
  --name "Admin" --email admin@gibz.ch --role admin
```

## 3. Point the frontend at the backend

The deploy workflow bakes the backend URL into the static build from a repo
variable:

1. GitHub repo → **Settings → Secrets and variables → Actions → Variables → New
   repository variable**.
2. Name: `NEXT_PUBLIC_API_BASE_URL`  ·  Value: your Render URL
   (e.g. `https://gibz-raumvermietung-backend.onrender.com`).
3. Re-run the **Deploy Frontend to GitHub Pages** workflow (or push to `main`).

This value is compiled into the JavaScript at build time — it cannot be changed
without rebuilding. Without it, the site shows **"API nicht konfiguriert"**.

## 4. CORS / cookies (already configured in `render.yaml`)

- `CORS_ORIGINS=https://rabbitglauser.github.io,http://localhost:3000` — the
  Pages origin is allowed.
- `AUTH_COOKIE_SECURE=true`, `AUTH_COOKIE_SAMESITE=none` — required for the staff
  auth cookie to be sent on cross-site requests (Pages → Render over HTTPS).

> Note: some browsers block third-party cookies by default, which can affect the
> cross-site staff session. Customer **booking** is unauthenticated and works
> regardless. If staff login is flaky across sites, host the frontend on the same
> domain as the backend, or test in a browser allowing third-party cookies.

## Checklist

- [ ] Atlas cluster up, user + network access set, SRV string copied
- [ ] Render Blueprint deployed, `MONGODB_URL` set, `/health` returns ok
- [ ] Staff account seeded
- [ ] GitHub repo variable `NEXT_PUBLIC_API_BASE_URL` = Render URL
- [ ] Pages workflow re-run; booking works at the live site

## Alternative: one-host deploy

If the cross-site cookie behaviour is a problem, deploy the **whole stack**
(frontend + backend + Mongo) with `docker compose up` on a single VPS/host, or
serve the Next.js app in `server` mode behind the same domain as the API. That
avoids GitHub Pages' static-only constraint entirely. For the M165 demo,
`docker compose up` locally is the simplest fully-working setup.

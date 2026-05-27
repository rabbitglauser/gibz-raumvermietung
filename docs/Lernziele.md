# Lernziele — Status M165 Raumvermietung

Statusübersicht der Bewertungskriterien aus dem Projektauftrag M165
(NoSQL-Datenbanken einsetzen, FS 2026).
**Total (geschätzt): 38 P · Note 6.0 (geschätzt): 36 P**

> Hinweis: Die Punkteverteilung ist eine eigene Schätzung — die offizielle
> M165-Aufgabenstellung definiert keine Punkte pro Kriterium.

Legende: `[x]` erledigt · `[~]` teilweise · `[ ]` offen

---

## Funktionale Anforderungen — Informationsbereitstellung (3 P)

| Kriterium | P | Status | Nachweis |
|---|---|---|---|
| Räume, Kapazität, Bestuhlung, Equipment abrufbar | 1 | [x] | `backend/app/routers/rooms.py`, `backend/app/models/reservation.py` (`ROOM_RULES` table) |
| Verfügbarkeit (Konfliktprüfung gegen bestehende Reservationen) | 1 | [x] | `backend/app/dao/reservation_dao.py:has_conflict` |
| Bilder, Preise, AGB | 1 | [ ] | noch nicht im Modell/Endpoint |

**Zwischensumme: 2 / 3** — TODO: Bilder, Preise und AGB-Felder zu Räumen ergänzen.

## Funktionale Anforderungen — Raumreservierung (4 P)

| Kriterium | P | Status | Nachweis |
|---|---|---|---|
| Selbst-Reservation (Datum, Start/Ende, Raum, Kontakt) | 1 | [x] | `POST /reservations` in `backend/app/routers/reservations.py`, `ReservationCreate` in `backend/app/models/reservation.py` |
| Konflikt-Check vor Bestätigung (409 bei Overlap) | 1 | [x] | `backend/app/services/reservation_service.py`, `ReservationDAO.has_conflict` |
| Adjacent Bookings erlaubt (Regression-Test) | 1 | [x] | `backend/tests/test_reservations.py` |
| Bestätigung mit `id` + `status: pending` + Timestamps | 1 | [x] | `backend/app/routers/reservations.py` (Response 201) |

**Zwischensumme: 4 / 4**

## Funktionale Anforderungen — Customer Edit & Deadline (3 P)

| Kriterium | P | Status | Nachweis |
|---|---|---|---|
| `PUT/PATCH /reservations/{id}` Edit-Endpoint | 2 | [ ] | Test geskipped: `backend/tests/test_edit_deadline.py` ("PUT/PATCH route not implemented yet") |
| Deadline (variabel einstellbar) erzwingt Sperre vor Anlass | 1 | [ ] | Konfigurations-Parameter und Logik fehlen |

**Zwischensumme: 0 / 3** — TODO: Update-Route + variable Deadline aus `config.py`.

## Funktionale Anforderungen — Catering / Einrichtung / Material (2 P)

| Kriterium | P | Status | Nachweis |
|---|---|---|---|
| Optionale Felder (Catering, Setup, Material) im Modell | 1 | [x] | `CateringInfo`, `SetupInfo` in `backend/app/models/reservation.py` |
| Nachträgliches Ergänzen via Update-Endpoint | 1 | [~] | Modell unterstützt es, aber Update-Route fehlt (s. Block oben) |

**Zwischensumme: 1 / 2** — gekoppelt an Edit-Endpoint.

## Funktionale Anforderungen — Auto-Reminders (2 P)

| Kriterium | P | Status | Nachweis |
|---|---|---|---|
| Automatische Erinnerung bei fehlenden Catering-/Setup-Angaben | 2 | [ ] | kein Scheduler / Cron / Mail-Service vorhanden |

**Zwischensumme: 0 / 2** — TODO: Reminder-Service + Mail/Notification-Channel.

## Funktionale Anforderungen — Staff CRUD & Filter (4 P)

| Kriterium | P | Status | Nachweis |
|---|---|---|---|
| Staff-Endpoints (Hausdienst/Sekretariat/Treff) für CRUD | 2 | [ ] | Tests geskipped: `backend/tests/test_staff_routes.py` |
| Filter `Zeitraum`, `Catering`, `anstehend`, `vergangen` | 2 | [ ] | `GET /reservations` ohne Query-Params in `backend/app/routers/reservations.py` |

**Zwischensumme: 0 / 4** — TODO: Staff-Router + Query-Filter.

## Funktionale Anforderungen — Auth / Rollen (2 P)

| Kriterium | P | Status | Nachweis |
|---|---|---|---|
| Rollen-Enum + User-DAO | 1 | [~] | `UserRole` in `backend/app/models/enums.py`, `backend/app/dao/user_dao.py` (Skeleton) |
| Auth-Dependency / Middleware | 1 | [ ] | nicht implementiert |

**Zwischensumme: 1 / 2** — TODO: FastAPI-Dependency für Staff-Auth.

## NFR — NoSQL-Datenbank & DAO (3 P)

| Kriterium | P | Status | Nachweis |
|---|---|---|---|
| MongoDB als NoSQL-Speicher (AsyncMongoClient) | 1 | [x] | `backend/app/db.py`, `docker-compose.yml` (`mongo:8` + named volume) |
| **DAO-Pattern** (M165-Pflichtkriterium) | 2 | [x] | `backend/app/dao/{reservation_dao,room_dao,user_dao}.py`; Routes → Services → DAO Trennung |

**Zwischensumme: 3 / 3**

## NFR — Backup & Restore (1 P)

| Kriterium | P | Status | Nachweis |
|---|---|---|---|
| Anleitung/Funktion für Backup & Restore | 1 | [x] | `docs/DEPLOYMENT.md` (mongodump/mongorestore-Block), `docs/ARCHITECTURE.md` |

**Zwischensumme: 1 / 1**

## NFR — Validierung & Fehlermeldungen (2 P)

| Kriterium | P | Status | Nachweis |
|---|---|---|---|
| Pydantic-Validierung (Pflichtfelder, Datum, Zeitraum, Werte) | 1 | [x] | `backend/app/models/reservation.py` (`field_validator`, `model_validator`) |
| Verständliche Fehlerausgabe (422 bei Validation, 409 bei Conflict) | 1 | [x] | FastAPI-Default + `ReservationConflictError` |

**Zwischensumme: 2 / 2**

## NFR — Konfiguration (1 P)

| Kriterium | P | Status | Nachweis |
|---|---|---|---|
| Env-Vars statt Hardcoding (Mongo-URL, Port, CORS, …) | 1 | [x] | `backend/app/config.py` (Pydantic Settings), `backend/.env` |

**Zwischensumme: 1 / 1**

## NFR — Docker Compose (1 P)

| Kriterium | P | Status | Nachweis |
|---|---|---|---|
| Komplett-Start via `docker compose up` (alle 3 Services) | 1 | [x] | `docker-compose.yml` (`mongodb`, `backend`, `frontend`) |

**Zwischensumme: 1 / 1**

## Dokumentation (3 P)

| Kriterium | P | Status | Nachweis |
|---|---|---|---|
| Architektur-Diagramm + Tech-Stack | 1 | [x] | `docs/ARCHITECTURE.md` (Mermaid), `docs/DATA_MODEL.md`, `README.md` |
| Installationsanleitung | 1 | [x] | `docs/DEPLOYMENT.md`, `README.md` |
| Fazit / Zusammenfassung | 1 | [ ] | nicht vorhanden — TODO am Ende der Arbeit |

**Zwischensumme: 2 / 3** — TODO: Fazit-Sektion am Schluss.

## Tests (2 P)

| Kriterium | P | Status | Nachweis |
|---|---|---|---|
| Backend-Tests (Health, Reservations, Rooms, DAO) | 1 | [x] | `backend/tests/test_health.py`, `test_reservations.py`, `test_rooms.py`, `test_dao.py` |
| Frontend-Tests | 1 | [ ] | keine Test-Dateien unter `frontend/src/` |

**Zwischensumme: 1 / 2** — TODO: Jest/Vitest + React Testing Library aufsetzen.

## CI/CD (1 P)

| Kriterium | P | Status | Nachweis |
|---|---|---|---|
| Pipeline (Build/Test/Deploy) | 1 | [~] | Frontend-Deploy: `.github/workflows/nextjs.yml`. **Backend-Pytest läuft nicht in CI**. |

**Zwischensumme: 0–1 / 1** — TODO: Pytest-Job in GitHub Actions.

## Präsentation / Screencast (2 P)

| Kriterium | P | Status | Nachweis |
|---|---|---|---|
| Screencast (max. 10 min) — Abgabe 24.06.2026 | 2 | [ ] | offen |

**Zwischensumme: 0 / 2** — kommt am Schluss der Projektphase.

## Projektabgabe / Rahmenbedingungen (1 P)

| Kriterium | P | Status | Nachweis |
|---|---|---|---|
| **GitLab-Repo** + Lehrperson `pascal.bammert` als Reporter | 1 | [ ] | aktuell GitHub — kritisch für offizielle Abgabe |
| PDF-Doku im Repo (Abgabe 10.06.2026) | — | [ ] | Markdown-Doku in `docs/`, PDF-Export fehlt |

**Zwischensumme: 0 / 1** — TODO: GitLab-Mirror einrichten, `pascal.bammert` als Reporter einladen, Doku als PDF exportieren.

## Zusatzfunktionen (1 P)

| Kriterium | P | Status | Nachweis |
|---|---|---|---|
| Sinnvolle Zusatzfunktionen (für Note 6, in Absprache mit Lehrperson) | 1 | [ ] | nicht definiert |

**Zwischensumme: 0 / 1** — TODO: Mit Lehrperson abstimmen (z. B. Kalender-Export, ICS-Feed, QR-Code für Termin, Statistik-Dashboard).

---

## Gesamtstand (Schätzung)

| Block | Punkte |
|---|---|
| Sicher erledigt | ~18 |
| Teilweise (Edit, Catering-Update, Auth, CI, Doku-Fazit) | 2–3 |
| Extern / noch ausstehend (Reminders, Staff CRUD, Filter, Reminders, Screencast, Zusatzfunktionen, GitLab) | 17 |
| **Aktuell wahrscheinlich** | **~18 / 38** |
| **Zielmarke 6.0** | **36 / 38** |

## Offene Punkte / TODOs

1. **Edit-Endpoint** `PUT/PATCH /reservations/{id}` mit variabler Deadline aus `config.py` — un-skipt `test_edit_deadline.py` (3 P).
2. **Staff-Router & Filter** (`Zeitraum`, `Catering`, `anstehend`, `vergangen`) implementieren — un-skipt `test_staff_routes.py` (4 P).
3. **Auth-Dependency** für Staff-Rollen (Hausdienst, Sekretariat, Restaurant Treff) (1 P).
4. **Auto-Reminder-Service** für fehlende Catering-/Setup-Angaben (z. B. APScheduler) (2 P).
5. **Bilder / Preise / AGB** zum Room-Modell ergänzen (1 P).
6. **Frontend-Tests** mit Jest/Vitest + React Testing Library aufsetzen (1 P).
7. **Backend-CI**: Pytest-Job in `.github/workflows/` ergänzen (1 P).
8. **Fazit-Sektion** in der Doku schreiben (1 P).
9. **GitLab-Repo** spiegeln + `pascal.bammert` als Reporter einladen, Doku als PDF exportieren (1 P, **kritisch für Abgabe**).
10. **Zusatzfunktionen** mit Lehrperson abstimmen und umsetzen (1 P).
11. **Screencast** (max. 10 min) bis 24.06.2026 produzieren (2 P).

# Lernziele — Status M165 Raumvermietung

Statusübersicht der Bewertungskriterien aus dem Projektauftrag M165
(NoSQL-Datenbanken einsetzen, FS 2026).
**Total (geschätzt): 38 P · Note 6.0 (geschätzt): 36 P**

Letzte Aktualisierung: 2026-06-09 (abgeglichen mit Code, `GAP_ANALYSIS.md`,
`PROJECT_DOCUMENTATION.md`).

> Hinweis: Die Punkteverteilung ist eine eigene Schätzung — die offizielle
> M165-Aufgabenstellung definiert keine Punkte pro Kriterium.

Legende: `[x]` erledigt · `[~]` teilweise · `[ ]` offen

---

## Funktionale Anforderungen — Informationsbereitstellung (3 P)

| Kriterium | P | Status | Nachweis |
|---|---|---|---|
| Räume, Kapazität, Bestuhlung, Equipment abrufbar | 1 | [x] | `backend/app/routers/rooms.py`, `backend/app/models/room.py` (`ROOM_RULES` / `Room`) |
| Verfügbarkeit (Konfliktprüfung gegen bestehende Reservationen) | 1 | [x] | `backend/app/dao/reservation_dao.py:has_conflict` |
| Bilder, Preise, AGB | 1 | [x] | `RoomPrice` (`*_chf`), `image_path` in `backend/app/models/room.py`; `/agb`-Seite + AGB-Checkbox im Booking-Wizard |

**Zwischensumme: 3 / 3**

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
| Edit-Endpoint (Reservation nachträglich ändern) | 2 | [x] | `GET/PUT /reservations/edit/{token}`; Tests in `backend/tests/test_edit_deadline.py` (nicht mehr geskipped) |
| Deadline (variabel einstellbar) erzwingt Sperre vor Anlass | 1 | [x] | Konfigurierbar `edit_deadline_hours` in `config.py`; 403 nach Cutoff |

**Zwischensumme: 3 / 3** — Hinweis: Staff-Vollzugriff `PUT/PATCH /reservations/{id}` (per ID) noch offen, optional.

## Funktionale Anforderungen — Catering / Einrichtung / Material (2 P)

| Kriterium | P | Status | Nachweis |
|---|---|---|---|
| Optionale Felder (Catering, Setup, Material) im Modell | 1 | [x] | `CateringInfo`, `SetupInfo` in `backend/app/models/reservation.py` |
| Nachträgliches Ergänzen via Update-Endpoint | 1 | [x] | über Customer-Edit `PUT /reservations/edit/{token}` |

**Zwischensumme: 2 / 2**

## Funktionale Anforderungen — Auto-Reminders (2 P)

| Kriterium | P | Status | Nachweis |
|---|---|---|---|
| Erinnerung bei fehlenden Catering-/Setup-Angaben | 2 | [~] | Missing-Info-Detection + Mail-Template + SMTP-Service vorhanden; Auslösung **manuell** via `POST /reminders/run` (kein Scheduler). Tests: `backend/tests/test_reminders.py` |

**Zwischensumme: 1–2 / 2** — Risiko: Rubrik erwartet *automatische* Erinnerung. Manuell ist „by design" dokumentiert. Voller Punkt mit APScheduler-Cron oder Lehrperson-OK.

## Funktionale Anforderungen — Staff CRUD & Filter (4 P)

| Kriterium | P | Status | Nachweis |
|---|---|---|---|
| Staff-Endpoints (Hausdienst/Sekretariat/Treff) für CRUD | 2 | [x] | Status-Update / Cancel-Routen; Tests `backend/tests/test_staff_routes.py` (nicht mehr geskipped) |
| Filter `Zeitraum`, `Catering`, `anstehend`, `vergangen` | 2 | [x] | `GET /reservations?from_date=&to_date=&has_catering=&upcoming=&past=`; Filter-Tests vorhanden |

**Zwischensumme: 4 / 4**

## Funktionale Anforderungen — Auth / Rollen (2 P)

| Kriterium | P | Status | Nachweis |
|---|---|---|---|
| Rollen-Enum + User-DAO | 1 | [x] | `UserRole` in `backend/app/models/enums.py`, `backend/app/dao/user_dao.py` |
| Auth-Dependency / Middleware | 1 | [x] | bcrypt-Hashing + PyJWT HTTP-only-Cookie + Staff-Auth-Dependency; Tests `test_auth_routes.py` |

**Zwischensumme: 2 / 2**

## NFR — NoSQL-Datenbank & DAO (3 P)

| Kriterium | P | Status | Nachweis |
|---|---|---|---|
| MongoDB als NoSQL-Speicher (AsyncMongoClient) | 1 | [x] | `backend/app/db.py`, `docker-compose.yml` (`mongo:8` + named volume) |
| **DAO-Pattern** (M165-Pflichtkriterium) | 2 | [x] | `backend/app/dao/{reservation_dao,room_dao,user_dao}.py`; Routes → Services → DAO Trennung |

**Zwischensumme: 3 / 3**

## NFR — Backup & Restore (1 P)

| Kriterium | P | Status | Nachweis |
|---|---|---|---|
| Anleitung/Funktion für Backup & Restore | 1 | [x] | `scripts/backup-mongodb.ps1`, `scripts/restore-mongodb.ps1`, `scripts/verify-mongodb-restore.ps1`, `docs/BACKUP_RESTORE.md` |

**Zwischensumme: 1 / 1**

## NFR — Validierung & Fehlermeldungen (2 P)

| Kriterium | P | Status | Nachweis |
|---|---|---|---|
| Pydantic-Validierung (Pflichtfelder, Datum, Zeitraum, Werte) | 1 | [x] | `backend/app/models/reservation.py` (`field_validator`, `model_validator`) |
| Verständliche Fehlerausgabe (422 bei Validation, 409 bei Conflict) | 1 | [x] | FastAPI-Default + `ReservationConflictError`; Tests `test_validation_errors.py` |

**Zwischensumme: 2 / 2**

## NFR — Konfiguration (1 P)

| Kriterium | P | Status | Nachweis |
|---|---|---|---|
| Env-Vars statt Hardcoding (Mongo-URL, Port, CORS, …) | 1 | [x] | `backend/app/config.py` (Pydantic Settings), `backend/.env.example` |

**Zwischensumme: 1 / 1**

## NFR — Docker Compose (1 P)

| Kriterium | P | Status | Nachweis |
|---|---|---|---|
| Komplett-Start via `docker compose up` (alle 3 Services) | 1 | [x] | `docker-compose.yml` (`mongodb`, `backend`, `frontend`) |

**Zwischensumme: 1 / 1**

## Dokumentation (3 P)

| Kriterium | P | Status | Nachweis |
|---|---|---|---|
| Architektur-Diagramm + Tech-Stack | 1 | [x] | `docs/ARCHITECTURE.md` (Mermaid), `docs/DATA_MODEL.md`, `PROJECT_DOCUMENTATION.md` §3.2/§3.3 |
| Installationsanleitung | 1 | [x] | `PROJECT_DOCUMENTATION.md` §3.5, `docs/DEPLOYMENT.md`, `README.md` |
| Fazit / Zusammenfassung | 1 | [x] | `PROJECT_DOCUMENTATION.md` §3.6 |

**Zwischensumme: 3 / 3** — Hinweis: PDF-Export für die Abgabe noch offen (s. Projektabgabe).

## Tests (2 P)

| Kriterium | P | Status | Nachweis |
|---|---|---|---|
| Backend-Tests (Health, Reservations, Rooms, DAO, Auth, Reminders) | 1 | [x] | `backend/tests/` — `pytest -q` → 65 passed |
| Frontend-Tests | 1 | [ ] | keine Test-Dateien unter `frontend/src/` |

**Zwischensumme: 1 / 2** — TODO: Vitest/Jest + React Testing Library aufsetzen.

## CI/CD (1 P)

| Kriterium | P | Status | Nachweis |
|---|---|---|---|
| Pipeline (Build/Test/Deploy) | 1 | [~] | Frontend-Deploy: `.github/workflows/nextjs.yml`. **Backend-Pytest läuft nicht in CI**. |

**Zwischensumme: 0–1 / 1** — TODO: Pytest-Job in GitHub Actions.

## Präsentation / Screencast (2 P)

| Kriterium | P | Status | Nachweis |
|---|---|---|---|
| Screencast (max. 10 min) — Abgabe 24.06.2026 | 2 | [ ] | Skript vorhanden (`docs/SCREENCAST.md`); Aufnahme + MP4-Export offen |

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
| Sicher erledigt | ~31 |
| Reminders (manuell, Risiko auf 2. Punkt) | +0–1 |
| Offen (Frontend-Tests, Backend-CI, Screencast, GitLab/PDF, Zusatzfunktion) | 7 |
| **Aktuell wahrscheinlich** | **~31 / 38** |
| **Zielmarke 6.0** | **36 / 38** |

## Offene Punkte / TODOs

1. **PDF-Export** der Doku (`PROJECT_DOCUMENTATION.md`) und ins Repo legen — **Abgabe 10.06.2026 (kritisch)**.
2. **GitLab-Repo** spiegeln + `pascal.bammert` als Reporter einladen (kritisch für offizielle Abgabe) (1 P).
3. **Screencast** (max. 10 min) aufnehmen + als MP4 exportieren — Abgabe 24.06.2026 (2 P).
4. **Backend-CI**: Pytest-Job in `.github/workflows/` ergänzen (1 P).
5. **Frontend-Tests** mit Vitest/Jest + React Testing Library aufsetzen (1 P).
6. **Auto-Reminder** zum Vollpunkt bringen: APScheduler-Cron auf bestehenden Reminder-Service ODER Manuell-Lösung mit Lehrperson absegnen (0–1 P).
7. **Zusatzfunktion** mit Lehrperson abstimmen und umsetzen (1 P).
8. Optional: Staff-Volledit `PUT/PATCH /reservations/{id}`, Edit-Link auf der Bestätigungsseite anzeigen/kopieren, Filter nach Name/Raum.

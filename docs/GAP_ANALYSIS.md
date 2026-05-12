# Project Status — Raumvermietung

> Code + Doku-Abgabe: **2026-06-10** · Screencast: **2026-06-24**

---

## Progress

```
███████░░░░░░░░░░░░░░░░░  29%   (7 / 24 done)
```

| Deadline | Datum | Tage übrig |
|---|---|---|
| 📄 Code + Doku (PDF) | 2026-06-10 | **29** |
| 🎬 Screencast | 2026-06-24 | **43** |
| ✅ GitHub Repo | von Lehrer akzeptiert | — |

---

## 🎯 Do this next (Top 3)

1. **Edit-Route + Edit-Deadline** — entsperrt `test_edit_deadline.py`, ist Pflicht-Anforderung.
2. **Staff-Routen mit Filtern** — entsperrt `test_staff_routes.py`, deckt drei Stakeholder ab.
3. **Note-6-Zusatzfunktion** mit Lehrer absprechen — blockiert sonst zu lange.

---

## Must-haves (werden benotet)

### 🔁 Reservation Lifecycle (0/4)
- [ ] `PUT /reservations/{id}` oder `PATCH` für Bearbeitung
- [ ] `DELETE /reservations/{id}` (oder Status → cancelled)
- [ ] Edit-Deadline-Check (HTTP 403 wenn überschritten)
- [ ] `EDIT_DEADLINE_DAYS` in `backend/app/config.py`

### 👥 Mitarbeiter-Zugriff (0/4)
- [ ] Auth-Skelett (Login, Password-Hash, JWT/Session)
- [ ] Staff-Routen ausimplementieren (`test_staff_routes.py`)
- [ ] Filter auf `GET /reservations`: `from_date`, `to_date`, `has_catering`, `upcoming|past`
- [ ] Status-Update-Route exponieren (DAO-Methode existiert bereits)

### 🔔 Automatisierung (0/4)
- [ ] Reminder-Scheduler (APScheduler in FastAPI-Lifespan)
- [ ] SMTP-Config (`SMTP_HOST`, `SMTP_USER`, …) in `config.py` + `.env.example`
- [ ] E-Mail-Template für „fehlende Angaben"
- [ ] Felder `reminder_sent_at` / `reminder_count` auf Reservation

### 🧑‍💻 Kunden-Flow (0/3)
- [ ] AGB-Seite (`/agb` oder Modal)
- [ ] AGB-Pflicht-Checkbox im Buchungs-Wizard
- [ ] Kunden-Edit-Zugang (Magic-Link-Token oder Login)

### 🛠️ Operations (0/2)
- [ ] Backup-Script (`mongodump`) + `docs/BACKUP_RESTORE.md`
- [ ] Restore-Anleitung für IT-Abteilung

---

## ⭐ Für Note 6 (0/3)
- [ ] Bonus-Feature mit Lehrer absprechen
- [ ] Umsetzen
- [ ] In Kapitel 3.1 dokumentieren

**Ideen:** ICS-Kalender-Export · PDF-Bestätigung · Live-Konflikt-Vorschau · Auslastungs-Dashboard · Volltextsuche

---

## 📚 Dokumentation (eine PDF) (0/7)
- [ ] MD-Dateien aus `docs/` zu einer PDF konsolidieren
- [ ] 3.1 Zusatzfunktionen
- [ ] 3.2 Architektur-Diagramm (`docs/diagrams/architecture.excalidraw` → PNG exportieren)
- [ ] 3.3 Technologie-Stack
- [ ] 3.4 Testen (mit Ergebnissen + Coverage)
- [ ] 3.5 Installationsanleitung
- [ ] 3.6 Fazit

---

## 🧪 Tests un-skippen (0/4)
- [ ] `backend/tests/test_edit_deadline.py`
- [ ] `backend/tests/test_staff_routes.py`
- [ ] Reminder-Test (neu, mit gemocktem `datetime.now`)
- [ ] Auth-Test (neu, 401/403-Pfade)

---

## 🎬 Screencast (0/5)
- [ ] Drehbuch (≤ 10 Min.)
- [ ] Golden-Path-Reservation aufnehmen
- [ ] Mitarbeiter-Sicht aufnehmen
- [ ] Bonus-Feature aufnehmen
- [ ] Export als `Screencast_<Klasse>.mp4`

---

## ✅ Schon erledigt (7/7)

- [x] `POST /reservations` mit Konflikt-Erkennung (inkl. adjazent-Booking-Test)
- [x] DAO-Layer (`reservation_dao`, `room_dao`, `user_dao`)
- [x] Pydantic-Validation auf Model-Ebene (`model_validator(mode="after")`)
- [x] MongoDB + Docker Compose (3 Services)
- [x] Räume-Liste + Detail-Seite im Frontend
- [x] Buchungs-Wizard im Frontend (`ReservationForm`)
- [x] Health-Check + Test-Suite mit In-Memory-Mock-Collection

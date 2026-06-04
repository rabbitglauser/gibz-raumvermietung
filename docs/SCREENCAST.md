# Screencast Script

Target length: 8-10 minutes.

## 1. Start and Context (0:00-0:45)

- Show the repository root.
- State that the project is a GIBZ room rental system using Next.js, FastAPI,
  and MongoDB.
- Start the stack:

  ```bash
  docker compose up --build
  ```

## 2. Public Room Flow (0:45-2:30)

- Open `http://localhost:3000`.
- Navigate to the room catalogue.
- Open one room detail page.
- Show capacity, equipment, seating options, and the booking action.

## 3. Reservation Creation + Conflict (2:30-4:00)

- Create a valid reservation through the booking dialog.
- Show that the backend returns success.
- Try another reservation for the same room/time.
- Show the conflict message.

## 4. Customer Edit Link (4:00-5:00)

- Open `/reservation/edit/<edit-token>`.
- Change a reservation field.
- Save and show success.
- Mention that the backend rejects edits after the configured deadline.

## 5. Staff Dashboard (5:00-7:00)

- Open `http://localhost:3000/staff`.
- Log in with the demo credentials from `backend/.env`.
- Show filters for date range, catering, upcoming, and past.
- Confirm one reservation.
- Reject or cancel another reservation.

## 6. Reminders (7:00-8:00)

- Click the reminder button in the staff dashboard.
- If SMTP is not configured, show the clear configuration error.
- If using a test SMTP server, show the successful reminder count.
- Mention that reminders include the customer edit link.

## 7. Tests and Wrap-Up (8:00-9:30)

- Run:

  ```bash
  pytest -q
  ```

- Show the result:

  ```text
  65 passed, 1 warning
  ```

- Briefly mention backup/restore scripts and Docker volume persistence.
- End with the main limitations: no SSO, no payment, no external calendar sync,
  and manual reminder trigger instead of a scheduler.

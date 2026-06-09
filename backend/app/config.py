from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "room-rental-api"
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db: str = "room_rental"
    cors_origins: str = "http://localhost:3000"
    edit_deadline_hours: int = 24
    auth_secret_key: str = "dev-secret-change-me"
    auth_token_minutes: int = 480
    auth_cookie_name: str = "staff_session"
    auth_cookie_secure: bool = False
    auth_cookie_samesite: str = "lax"
    public_frontend_url: str = "http://localhost:3000"
    seed_staff_enabled: bool = False
    seed_staff_username: str = "secretariat"
    seed_staff_password: str = "ChangeMe123!"
    seed_staff_name: str = "Demo Secretariat"
    seed_staff_email: str = "secretariat@example.com"
    reminder_days_before: int = 7
    reminder_scheduler_enabled: bool = False
    reminder_scheduler_interval_seconds: int = 86400
    # SMTP for reminder emails. The reminder run is enabled as soon as
    # smtp_host is set (smtp_from_email has a sensible default). Locally this
    # points at the MailHog container (host "mailhog", port 1025, no TLS); in
    # production set these to the real mail server via environment variables.
    smtp_host: str = ""
    smtp_port: int = 1025
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = "raumvermietung@gibz.ch"
    smtp_use_tls: bool = False

    # Customer self-service window. Edits are allowed until this many days
    # before the event date. "Variabel einstellbar" per the M165 brief — do
    # not hardcode the deadline anywhere else.
    edit_deadline_days: int = 3

    # Reminders for incomplete reservations fire when the event is within
    # this many days and catering/setup details are still missing.
    reminder_window_days: int = 5
    # How often the background reminder job runs, in minutes.
    reminder_interval_minutes: int = 60
    # Master switch so tests / SMTP-less environments don't start the job.
    reminders_enabled: bool = False

    # Staff auth.
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480
    # Name of the HTTP-only cookie that carries the staff JWT.
    auth_cookie_name: str = "rr_session"
    # Whether the auth cookie requires HTTPS. Off for local/demo.
    auth_cookie_secure: bool = False

    # Base URL used to build customer edit links inside reminder emails.
    public_base_url: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()

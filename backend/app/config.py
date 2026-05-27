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
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_from_email: str | None = None
    smtp_use_tls: bool = True

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()

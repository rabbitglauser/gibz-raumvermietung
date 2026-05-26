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

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()

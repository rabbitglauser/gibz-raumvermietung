from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "room-rental-api"
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db: str = "room_rental"
    cors_origins: str = "http://localhost:3000"
    staff_secret_token: str = "change-me-in-production"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
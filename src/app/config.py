from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env.local", env_file_encoding="utf-8", extra="ignore"
    )

    environment: Literal["development", "staging", "production"] = "development"

    database_url: str = "postgresql+asyncpg://ludens:ludens@dom-ludens-postgres-dev:5432/ludens"

    jwt_secret_key: str = "change-me-openssl-rand-hex-32"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    allowed_origins: list[str] = ["http://localhost:5173"]

    outbox_relay_interval_seconds: int = 2

    @property
    def db_connect_args(self) -> dict:
        return {"ssl": "require"} if self.environment != "development" else {}

settings = Settings()  # type: ignore[call-arg]

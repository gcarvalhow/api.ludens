from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuração da aplicação, lida de variáveis de ambiente / .env.

    Ver docs.ludens/backend/security/configuration.md para a classificação de
    segurança de cada variável (SECRET / SENSITIVE / CONFIG).
    """

    model_config = SettingsConfigDict(env_file=".env.local", extra="ignore")

    environment: str = "development"
    database_url: str = "postgresql+asyncpg://ludens:ludens@dom-ludens-postgres-dev:5432/ludens"
    jwt_secret_key: str = "change-me"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    allowed_origins: list[str] = ["http://localhost:5173"]
    outbox_relay_interval_seconds: int = 2


@lru_cache
def get_settings() -> Settings:
    return Settings()

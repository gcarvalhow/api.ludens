from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuração da aplicação, lida de variáveis de ambiente / .env.local.

    Ver docs.ludens/backend/security/configuration.md para a classificação de
    segurança de cada variável (SECRET / SENSITIVE / CONFIG). Cada feature
    acrescenta as próprias variáveis (AbacatePay, SMTP, TTL de reserva…) —
    ver as specs em docs.ludens/specs/.
    """

    model_config = SettingsConfigDict(
        env_file=".env.local", env_file_encoding="utf-8", extra="ignore"
    )

    environment: Literal["development", "staging", "production"] = "development"

    # Banco
    database_url: str = "postgresql+asyncpg://ludens:ludens@dom-ludens-postgres-dev:5432/ludens"

    # JWT (identity-auth) — ver docs.ludens/backend/security/authentication.md
    jwt_secret_key: str = "change-me-openssl-rand-hex-32"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # CORS
    allowed_origins: list[str] = ["http://localhost:5173"]

    # Outbox in-process (ADR 001) — intervalo de polling do relay
    outbox_relay_interval_seconds: int = 2

    @property
    def db_connect_args(self) -> dict:
        # TLS no transporte em ambientes não-locais; sem validação de cert do
        # servidor (rede privada). Ajustar quando houver um alvo de deploy.
        return {"ssl": "require"} if self.environment != "development" else {}


settings = Settings()  # type: ignore[call-arg]

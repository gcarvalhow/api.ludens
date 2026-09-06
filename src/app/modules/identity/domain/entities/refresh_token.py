from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.domain.model import Model


class RefreshToken(Model):
    # Entidade filha do Buyer, sem AggregateRoot: nao levanta eventos proprios.
    # Trafega opaco — o banco guarda so' o hash SHA-256 (64 chars hex) do token.
    __tablename__ = "refresh_tokens"

    buyer_id: Mapped[UUID] = mapped_column(nullable=False, index=True)
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    rotated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    def mark_rotated(self) -> None:
        # Rotacao a cada uso: o token consumido fica marcado, e um novo par e'
        # emitido. Reusar um token ja marcado dispara a deteccao de reuso.
        self.used = True
        self.rotated_at = datetime.now(timezone.utc)

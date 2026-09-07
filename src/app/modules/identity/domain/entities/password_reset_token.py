from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.domain import GoneError, Model

class PasswordResetToken(Model):
    __tablename__ = "password_reset_tokens"

    user_id: Mapped[UUID] = mapped_column(nullable=False, index=True)
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    def consume(self, now: datetime) -> None:
        if self.used_at is not None or self.expires_at <= now:
            raise GoneError("Este link não é mais válido, solicite um novo.")
        
        self.used_at = now

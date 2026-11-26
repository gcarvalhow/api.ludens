from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.domain import Model

class EmailChangeToken(Model):
    __tablename__ = "email_change_tokens"

    user_id: Mapped[UUID] = mapped_column(nullable=False, index=True)
    new_email: Mapped[str] = mapped_column(String(254), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    def is_valid(self, now: datetime) -> bool:
        return self.used_at is None and self.expires_at > now

    def consume(self, now: datetime) -> None:
        self.used_at = now

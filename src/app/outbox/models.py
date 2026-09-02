from datetime import datetime

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID

from app.core.domain.model import Model

class Event(Model):
    __tablename__ = "events"

    # Não é FK de propósito: a tabela `events` precisa sobreviver a soft delete e
    # a mudanças de schema das tabelas de domínio.
    aggregate_id: Mapped[str] = mapped_column(PG_UUID(as_uuid=False), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    # NULL = pendente; preenchido = os handlers já rodaram com sucesso. Nunca volta a NULL.
    dispatched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

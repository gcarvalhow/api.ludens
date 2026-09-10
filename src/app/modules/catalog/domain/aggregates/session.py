from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Integer, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.core.domain.aggregate import AggregateRoot
from app.core.domain.errors import ConflictError, DomainError
from app.core.domain.events import DomainEvent
from app.core.domain.model import Model
from app.modules.catalog.domain.enumerations.session_status import SessionStatus
from app.modules.catalog.domain.events.catalog_events import (
    SessionCancelled,
    SessionCreated,
    SessionDeactivated,
    SessionUpdated,
)
from app.modules.catalog.domain.value_objects.money import Money


class Session(AggregateRoot, Model):
    __tablename__ = "sessions"

    show_id: Mapped[UUID] = mapped_column(
        Uuid(), ForeignKey("shows.id"), nullable=False, index=True
    )
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    venue: Mapped[str] = mapped_column(String(200), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    full_price_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[SessionStatus] = mapped_column(
        SAEnum(
            SessionStatus,
            native_enum=False,
            length=20,
            values_callable=lambda enum: [m.value for m in enum],
        ),
        nullable=False,
        default=SessionStatus.ON_SALE,
    )

    @property
    def full_price(self) -> Money:
        return Money(cents=self.full_price_cents)

    @property
    def half_price(self) -> Money:
        return self.full_price.half()

    def is_on_sale(self, now: datetime) -> bool:
        # A parte "espetáculo publicado" é resolvida na leitura/usecase
        # (logic.md §4) — o aggregate só conhece o próprio estado.
        return self.status is SessionStatus.ON_SALE and self.starts_at > now

    @classmethod
    def create(
        cls,
        *,
        show_id: UUID,
        starts_at: datetime,
        venue: str,
        capacity: int,
        full_price: Money,
        now: datetime,
    ) -> "Session":
        if starts_at <= now:
            raise DomainError("A data da sessão deve ser futura.")
        if capacity <= 0:
            raise DomainError("A capacidade deve ser maior que zero.")
        session = cls()
        session.id = uuid4()
        session.raise_event(
            lambda v: SessionCreated(
                version=v, id=session.id, show_id=show_id, starts_at=starts_at,
                venue=venue, capacity=capacity, full_price_cents=full_price.cents,
            )
        )
        return session

    def update(
        self,
        *,
        starts_at: datetime,
        venue: str,
        capacity: int,
        full_price: Money,
        committed: int,
        now: datetime,
    ) -> None:
        # `committed` = confirmados + reservas abertas não vencidas (contado
        # pelo usecase). Reduzir capacidade abaixo disso é bloqueado.
        if self.status is SessionStatus.CANCELLED:
            raise ConflictError("Não é possível editar uma sessão cancelada.")
        if starts_at <= now:
            raise DomainError("A data da sessão deve ser futura.")
        if capacity < committed:
            raise ConflictError("Já há ingressos comprometidos nesta sessão.")
        self.raise_event(
            lambda v: SessionUpdated(
                version=v, id=self.id, starts_at=starts_at, venue=venue,
                capacity=capacity, full_price_cents=full_price.cents,
            )
        )

    def cancel(self) -> None:
        # Sessão à venda → cancelada. O SessionCancelled gravado na mesma
        # transação dispara o reembolso em massa (RF07) e o aviso.
        if self.status is SessionStatus.CANCELLED:
            raise ConflictError("A sessão já está cancelada.")
        self.raise_event(
            lambda v: SessionCancelled(
                version=v, id=self.id, show_id=self.show_id,
                starts_at=self.starts_at, cancelled_at=datetime.now(timezone.utc),
            )
        )

    def deactivate(self, *, tickets_sold: int) -> None:
        # Regra central RF08: sessão com ingresso vendido NÃO se apaga.
        if tickets_sold > 0:
            raise ConflictError("Cancele a sessão em vez de excluir.")
        self.raise_event(lambda v: SessionDeactivated(version=v, id=self.id))

    def _apply(self, event: DomainEvent) -> None:
        handler = getattr(self, f"_when_{type(event).__name__}", None)
        if handler is not None:
            handler(event)

    def _when_SessionCreated(self, e: SessionCreated) -> None:
        self.show_id = e.show_id
        self.starts_at = e.starts_at
        self.venue = e.venue
        self.capacity = e.capacity
        self.full_price_cents = e.full_price_cents
        self.status = SessionStatus.ON_SALE
        self.is_active = True

    def _when_SessionUpdated(self, e: SessionUpdated) -> None:
        self.starts_at = e.starts_at
        self.venue = e.venue
        self.capacity = e.capacity
        self.full_price_cents = e.full_price_cents

    def _when_SessionCancelled(self, _event: SessionCancelled) -> None:
        self.status = SessionStatus.CANCELLED

    def _when_SessionDeactivated(self, _event: SessionDeactivated) -> None:
        self.is_active = False

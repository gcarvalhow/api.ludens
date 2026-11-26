from __future__ import annotations

from uuid import UUID, uuid4
from typing import NamedTuple
from datetime import datetime, timezone

from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Integer, String, Uuid

from app.core.domain.model import Model
from app.core.domain.events import DomainEvent
from app.core.domain.aggregate import AggregateRoot

from app.modules.catalog.domain.enumerations import SessionStatus
from app.modules.catalog.domain.events import (
    SessionCancelled,
    SessionCreated,
    SessionDeactivated,
    SessionUpdated,
)

class SeatCounts(NamedTuple):
    tickets_sold: int
    reserved_open: int

class Session(AggregateRoot, Model):
    __tablename__ = "sessions"

    show_id: Mapped[UUID] = mapped_column(Uuid(), ForeignKey("shows.id"), nullable=False, index=True)
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
    def half_price_cents(self) -> int:
        # RN04 — 50% of the full price, truncated to the cent. Derived, never entered directly.
        return self.full_price_cents // 2

    def available_count(self, counts: SeatCounts) -> int:
        # Available = capacity - confirmed - open, non-expired reservations.
        # This is a point-in-time read, not a guarantee: the reservation revalidates under lock (RN05).
        return max(0, self.capacity - counts.tickets_sold - counts.reserved_open)

    def status_at(self, now: datetime, counts: SeatCounts) -> str:
        if self.status is SessionStatus.CANCELLED:
            return "cancelled"
        if self.starts_at <= now:
            return "closed"
        if self.available_count(counts) <= 0:
            return "sold_out"

        return "on_sale"

    @classmethod
    def create(
        cls,
        *,
        show_id: UUID,
        starts_at: datetime,
        venue: str,
        capacity: int,
        full_price_cents: int,
    ) -> "Session":
        session = cls()
        session.id = uuid4()

        session.raise_event(
            lambda v: SessionCreated(
                version=v, id=session.id, show_id=show_id, starts_at=starts_at,
                venue=venue, capacity=capacity, full_price_cents=full_price_cents,
            )
        )

        return session

    def update(
        self,
        *,
        starts_at: datetime,
        venue: str,
        capacity: int,
        full_price_cents: int,
    ) -> None:
        self.raise_event(
            lambda v: SessionUpdated(
                version=v, id=self.id, starts_at=starts_at, venue=venue,
                capacity=capacity, full_price_cents=full_price_cents,
            )
        )

    def cancel(self) -> None:
        self.raise_event(
            lambda v: SessionCancelled(
                version=v, id=self.id, show_id=self.show_id,
                starts_at=self.starts_at, cancelled_at=datetime.now(timezone.utc),
            )
        )

    def deactivate(self) -> None:
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

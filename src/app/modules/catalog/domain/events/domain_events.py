from __future__ import annotations

from uuid import UUID
from datetime import datetime
from dataclasses import dataclass, field

from app.core.domain.events import DomainEvent

@dataclass(frozen=True)
class ShowCreated(DomainEvent):
    id: UUID = field(kw_only=True)
    title: str = field(kw_only=True)
    synopsis: str = field(kw_only=True)
    image_url: str = field(kw_only=True)
    genre: str = field(kw_only=True)

@dataclass(frozen=True)
class ShowUpdated(DomainEvent):
    id: UUID = field(kw_only=True)
    title: str = field(kw_only=True)
    synopsis: str = field(kw_only=True)
    image_url: str = field(kw_only=True)
    genre: str = field(kw_only=True)

@dataclass(frozen=True)
class ShowPublished(DomainEvent):
    id: UUID = field(kw_only=True)

@dataclass(frozen=True)
class ShowUnpublished(DomainEvent):
    id: UUID = field(kw_only=True)

@dataclass(frozen=True)
class ShowDeactivated(DomainEvent):
    id: UUID = field(kw_only=True)

@dataclass(frozen=True)
class SessionCreated(DomainEvent):
    id: UUID = field(kw_only=True)
    show_id: UUID = field(kw_only=True)
    starts_at: datetime = field(kw_only=True)
    venue: str = field(kw_only=True)
    capacity: int = field(kw_only=True)
    full_price_cents: int = field(kw_only=True)

@dataclass(frozen=True)
class SessionUpdated(DomainEvent):
    id: UUID = field(kw_only=True)
    starts_at: datetime = field(kw_only=True)
    venue: str = field(kw_only=True)
    capacity: int = field(kw_only=True)
    full_price_cents: int = field(kw_only=True)

@dataclass(frozen=True)
class SessionCancelled(DomainEvent):
    # Consumed by `payment` (bulk refund — RF07 / RN02 triggered by the
    # cancellation) and by `notification` (notice to buyers).
    id: UUID = field(kw_only=True)
    show_id: UUID = field(kw_only=True)
    starts_at: datetime = field(kw_only=True)
    cancelled_at: datetime = field(kw_only=True)

@dataclass(frozen=True)
class SessionDeactivated(DomainEvent):
    id: UUID = field(kw_only=True)

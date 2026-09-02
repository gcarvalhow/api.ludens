from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Protocol, runtime_checkable

@runtime_checkable
class IVersionedEvent(Protocol):
    version: int
    timestamp: datetime

@runtime_checkable
class IDomainEvent(IVersionedEvent, Protocol):
    """Marker: evento levantado por um aggregate."""

@runtime_checkable
class IDelayedEvent(IVersionedEvent, Protocol):
    """Marker: evento com dispatch postergado."""
    delay_seconds: int

@dataclass(frozen=True)
class DomainEvent:
    """Base concreta. Equivalente a Message + IDomainEvent."""
    version: int
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

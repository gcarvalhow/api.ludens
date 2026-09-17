from datetime import datetime, timezone
from dataclasses import dataclass, field
from typing import Protocol, runtime_checkable

@runtime_checkable
class IVersionedEvent(Protocol):
    version: int
    timestamp: datetime

@runtime_checkable
class IDomainEvent(IVersionedEvent, Protocol):
    """Marker: event raised by an aggregate."""

@runtime_checkable
class IDelayedEvent(IVersionedEvent, Protocol):
    delay_seconds: int

@dataclass(frozen=True)
class DomainEvent:
    version: int
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

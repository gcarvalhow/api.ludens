from collections import deque
from typing import Callable, TypeVar
from app.core.domain.events import DomainEvent

T = TypeVar("T", bound=DomainEvent)

class AggregateRoot:
    def __init__(self) -> None:
        self._version: int = 0
        self._events: deque[DomainEvent] = deque()

    @property
    def version(self) -> int:
        return self._version

    def raise_event(self, factory: Callable[[int], T]) -> None:
        self._version += 1
        event = factory(self._version)
        
        self._apply(event)
        self._events.append(event)

    def dequeue_events(self) -> list[DomainEvent]:
        events, self._events = list(self._events), deque()
        return events

    def load_from_stream(self, events: list[DomainEvent]) -> None:
        for event in sorted(events, key=lambda e: e.version):
            self._apply(event)
            self._version = event.version

    def _apply(self, event: DomainEvent) -> None:
        raise NotImplementedError
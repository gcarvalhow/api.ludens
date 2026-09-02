from collections import deque
from typing import Callable, TypeVar
from app.core.domain.events import DomainEvent

T = TypeVar("T", bound=DomainEvent)

# Raiz de agregado: acumula eventos de domínio e os aplica ao próprio estado.
# Fluxo: um método de negócio chama raise_event(...); o evento é aplicado na hora
# via _apply (o estado muda imediatamente) e enfileirado. O repositório drena a
# fila em save() e grava as linhas na tabela `events` (Outbox), na mesma
# transação da mudança de estado.
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
        # Reconstrução a partir de um stream de eventos. Não é caminho de
        # produção — o estado persistido é sempre a projeção atual em colunas.
        for event in sorted(events, key=lambda e: e.version):
            self._apply(event)
            self._version = event.version

    def _apply(self, event: DomainEvent) -> None:
        # Cada agregado implementa: normalmente despacha para _when_<NomeDoEvento>.
        raise NotImplementedError

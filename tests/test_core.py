"""Testes da camada core copiada de api.hub.dommed — mecânica de AggregateRoot.
Sem DB, sem HTTP (ver docs.ludens/backend/testing.md)."""

from dataclasses import dataclass, field
from uuid import UUID, uuid4

from app.core.domain.aggregate import AggregateRoot
from app.core.domain.events import DomainEvent


@dataclass(frozen=True)
class ThingCreated(DomainEvent):
    id: UUID = field(kw_only=True)
    label: str = field(kw_only=True)


@dataclass(frozen=True)
class ThingRelabelled(DomainEvent):
    id: UUID = field(kw_only=True)
    label: str = field(kw_only=True)


class Thing(AggregateRoot):
    def __init__(self) -> None:
        super().__init__()
        self.id = uuid4()
        self.label = ""

    @classmethod
    def create(cls, label: str) -> "Thing":
        thing = cls()
        thing.raise_event(lambda v: ThingCreated(version=v, id=thing.id, label=label))
        return thing

    def relabel(self, label: str) -> None:
        self.raise_event(lambda v: ThingRelabelled(version=v, id=self.id, label=label))

    def _apply(self, event: DomainEvent) -> None:
        handler = getattr(self, f"_when_{type(event).__name__}", None)
        if handler:
            handler(event)

    def _when_ThingCreated(self, event: ThingCreated) -> None:
        self.label = event.label

    def _when_ThingRelabelled(self, event: ThingRelabelled) -> None:
        self.label = event.label


def test_raise_event_applies_state_and_enqueues():
    thing = Thing.create("primeiro")
    assert thing.label == "primeiro"
    assert thing.version == 1

    thing.relabel("segundo")
    assert thing.label == "segundo"
    assert thing.version == 2


def test_dequeue_events_drains_the_queue():
    thing = Thing.create("x")
    thing.relabel("y")

    events = thing.dequeue_events()
    assert [type(e).__name__ for e in events] == ["ThingCreated", "ThingRelabelled"]
    assert [e.version for e in events] == [1, 2]

    assert thing.dequeue_events() == []


def test_reconstructor_restores_state_the_orm_skips_on_load():
    # __new__ sem __init__ é como o SQLAlchemy reidrata uma instância existente
    # (find_by_id etc.) — _version/_events nunca são setados por __init__ nesse
    # caminho. Sem o @reconstructor em AggregateRoot, raise_event() aqui
    # quebraria com AttributeError.
    thing = Thing.__new__(Thing)
    assert "_version" not in vars(thing)

    thing._init_on_load()
    thing.id = uuid4()
    thing.relabel("recarregado")

    assert thing.version == 1
    assert [type(e).__name__ for e in thing.dequeue_events()] == ["ThingRelabelled"]

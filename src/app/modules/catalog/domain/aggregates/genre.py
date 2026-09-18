from __future__ import annotations

from uuid import uuid4
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.domain.model import Model
from app.core.domain.events import DomainEvent
from app.core.domain.aggregate import AggregateRoot

from app.modules.catalog.domain.events import GenreCreated, GenreDeactivated, GenreUpdated

class Genre(AggregateRoot, Model):
    __tablename__ = "genres"

    name: Mapped[str] = mapped_column(String(80), nullable=False)

    @classmethod
    def create(cls, *, name: str) -> "Genre":
        genre = cls()
        genre.id = uuid4()

        genre.raise_event(lambda v: GenreCreated(version=v, id=genre.id, name=name))
        return genre

    def update(self, *, name: str) -> None:
        self.raise_event(lambda v: GenreUpdated(version=v, id=self.id, name=name))

    def deactivate(self) -> None:
        self.raise_event(lambda v: GenreDeactivated(version=v, id=self.id))

    def _apply(self, event: DomainEvent) -> None:
        handler = getattr(self, f"_when_{type(event).__name__}", None)
        if handler is not None:
            handler(event)

    def _when_GenreCreated(self, e: GenreCreated) -> None:
        self.name = e.name
        self.is_active = True

    def _when_GenreUpdated(self, e: GenreUpdated) -> None:
        self.name = e.name

    def _when_GenreDeactivated(self, _event: GenreDeactivated) -> None:
        self.is_active = False

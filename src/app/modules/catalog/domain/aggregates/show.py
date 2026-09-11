from __future__ import annotations

from uuid import uuid4
from sqlalchemy import String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.core.domain.model import Model
from app.core.domain.events import DomainEvent
from app.core.domain.aggregate import AggregateRoot

from app.modules.catalog.domain.enumerations import ShowStatus
from app.modules.catalog.domain.events import (
    ShowCreated,
    ShowDeactivated,
    ShowPublished,
    ShowUnpublished,
    ShowUpdated,
)

class Show(AggregateRoot, Model):
    __tablename__ = "shows"

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    synopsis: Mapped[str] = mapped_column(String(5000), nullable=False)
    image_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    genre: Mapped[str] = mapped_column(String(80), nullable=False)

    status: Mapped[ShowStatus] = mapped_column(
        SAEnum(
            ShowStatus,
            native_enum=False,
            length=20,
            values_callable=lambda enum: [m.value for m in enum],
        ),
        nullable=False,
        default=ShowStatus.DRAFT,
    )

    @classmethod
    def create(cls, *, title: str, synopsis: str, image_url: str, genre: str) -> "Show":
        show = cls()
        show.id = uuid4()

        show.raise_event(
            lambda v: ShowCreated(
                version=v, id=show.id, title=title, synopsis=synopsis,
                image_url=image_url, genre=genre,
            )
        )
        return show

    def update(self, *, title: str, synopsis: str, image_url: str, genre: str) -> None:
        self.raise_event(
            lambda v: ShowUpdated(
                version=v, id=self.id, title=title, synopsis=synopsis,
                image_url=image_url, genre=genre,
            )
        )

    def publish(self) -> None:
        if self.status is ShowStatus.PUBLISHED:
            return
        
        self.raise_event(lambda v: ShowPublished(version=v, id=self.id))

    def unpublish(self) -> None:
        if self.status is ShowStatus.DRAFT:
            return
        
        self.raise_event(lambda v: ShowUnpublished(version=v, id=self.id))

    def deactivate(self) -> None:
        self.raise_event(lambda v: ShowDeactivated(version=v, id=self.id))

    def _apply(self, event: DomainEvent) -> None:
        handler = getattr(self, f"_when_{type(event).__name__}", None)
        if handler is not None:
            handler(event)

    def _when_ShowCreated(self, e: ShowCreated) -> None:
        self.title = e.title
        self.synopsis = e.synopsis
        self.image_url = e.image_url
        self.genre = e.genre
        self.status = ShowStatus.DRAFT
        self.is_active = True

    def _when_ShowUpdated(self, e: ShowUpdated) -> None:
        self.title = e.title
        self.synopsis = e.synopsis
        self.image_url = e.image_url
        self.genre = e.genre

    def _when_ShowPublished(self, _event: ShowPublished) -> None:
        self.status = ShowStatus.PUBLISHED

    def _when_ShowUnpublished(self, _event: ShowUnpublished) -> None:
        self.status = ShowStatus.DRAFT

    def _when_ShowDeactivated(self, _event: ShowDeactivated) -> None:
        self.is_active = False

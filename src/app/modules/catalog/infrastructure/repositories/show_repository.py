from __future__ import annotations

from uuid import UUID
from typing import NamedTuple
from datetime import datetime

from sqlalchemy import distinct, func, select
from sqlalchemy.dialects.postgresql import aggregate_order_by

from app.core.infrastructure.repositories import AggregateRepository
from app.modules.catalog.domain.aggregates import Session, Show
from app.modules.catalog.domain.enumerations import SessionStatus, ShowStatus

class ShowCardRow(NamedTuple):
    id: UUID
    title: str
    synopsis: str
    image_url: str
    genre: str
    upcoming_dates: list[datetime]
    price_min_cents: int
    price_max_cents: int

class ShowSearchPage(NamedTuple):
    rows: list[ShowCardRow]
    total: int

def _in_catalog(floor: datetime):
    # Em cartaz = espetáculo publicado com ao menos uma sessão à venda a partir
    # de `floor`. Sessão passada não entra em data, preço nem na existência.
    return (
        Show.is_active.is_(True),
        Show.status == ShowStatus.PUBLISHED,
        Session.is_active.is_(True),
        Session.status == SessionStatus.ON_SALE,
        Session.starts_at >= floor,
    )

class ShowRepository(AggregateRepository[Show]):
    model = Show

    async def search_with_upcoming(
        self, *, floor: datetime, genres: list[str] | None, page: int, size: int
    ) -> ShowSearchPage:
        next_at = func.min(Session.starts_at).label("next_at")
        stmt = (
            select(
                Show.id,
                Show.title,
                Show.synopsis,
                Show.image_url,
                Show.genre,
                func.array_agg(
                    aggregate_order_by(distinct(Session.starts_at), Session.starts_at.asc())
                ).label("upcoming_dates"),
                func.min(Session.full_price_cents).label("price_min_cents"),
                func.max(Session.full_price_cents).label("price_max_cents"),
                next_at,
                # Conta os grupos antes do LIMIT — total da paginação numa query só.
                func.count().over().label("total"),
            )
            .join(Session, Session.show_id == Show.id)
            .where(*_in_catalog(floor))
            .group_by(Show.id)
            .order_by(next_at.asc())
            .limit(size)
            .offset((page - 1) * size)
        )

        if genres is not None:
            stmt = stmt.where(Show.genre.in_(genres))

        result = (await self._session.execute(stmt)).all()
        if not result:
            return ShowSearchPage(rows=[], total=0)

        rows = [
            ShowCardRow(
                id=row.id,
                title=row.title,
                synopsis=row.synopsis,
                image_url=row.image_url,
                genre=row.genre,
                upcoming_dates=list(row.upcoming_dates),
                price_min_cents=row.price_min_cents,
                price_max_cents=row.price_max_cents,
            )
            for row in result
        ]

        return ShowSearchPage(rows=rows, total=int(result[0].total))

    async def list_genres_in_catalog(self, *, floor: datetime) -> list[str]:
        result = await self._session.execute(
            select(Show.genre)
            .join(Session, Session.show_id == Show.id)
            .where(*_in_catalog(floor))
            .group_by(Show.genre)
            .order_by(Show.genre.asc())
        )

        return list(result.scalars().all())

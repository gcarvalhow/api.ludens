from __future__ import annotations

from uuid import UUID
from typing import NamedTuple
from datetime import datetime

from sqlalchemy import distinct, func, select
from sqlalchemy.dialects.postgresql import aggregate_order_by
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.catalog.domain.aggregates import Session, Show
from app.core.infrastructure.repositories import paginate
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

class ShowSearchQuery:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def search_with_upcoming(self, *, floor: datetime, genres: list[str] | None, page: int, size: int) -> tuple[list[ShowCardRow], int]:
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
            )
            .join(Session, Session.show_id == Show.id)
            .where(*self._filters(floor, genres))
            .group_by(Show.id)
            .order_by(next_at.asc(), Show.id.asc())
        )

        rows, total = await paginate(self._session, stmt, page=page, size=size)

        return [
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
            for row in rows
        ], total

    async def list_genres_in_catalog(self, *, floor: datetime) -> list[str]:
        result = await self._session.execute(
            select(Show.genre)
            .join(Session, Session.show_id == Show.id)
            .where(*self._filters(floor, None))
            .group_by(Show.genre)
            .order_by(Show.genre.asc())
        )

        return list(result.scalars().all())

    @staticmethod
    def _filters(floor: datetime, genres: list[str] | None) -> list:
        filters = [
            Show.is_active.is_(True),
            Show.status == ShowStatus.PUBLISHED,
            Session.is_active.is_(True),
            Session.status == SessionStatus.ON_SALE,
            Session.starts_at >= floor,
        ]

        if genres is not None:
            filters.append(Show.genre.in_(genres))

        return filters

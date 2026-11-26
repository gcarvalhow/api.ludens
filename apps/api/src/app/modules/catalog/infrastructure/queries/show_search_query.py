from __future__ import annotations

from uuid import UUID
from typing import NamedTuple
from datetime import datetime

from sqlalchemy import distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import aggregate_order_by

from app.core.infrastructure.queries import paginate
from app.modules.catalog.domain.aggregates import Genre, Session, Show
from app.modules.catalog.domain.enumerations import SessionStatus, ShowStatus

class ShowCardRow(NamedTuple):
    id: UUID
    title: str
    synopsis: str
    image_url: str
    genre_id: UUID
    genre_name: str
    upcoming_dates: list[datetime]
    price_min_cents: int
    price_max_cents: int

class ShowSearchQuery:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def search_with_upcoming(self, *, floor: datetime, genre_id: UUID | None, page: int, size: int) -> tuple[list[ShowCardRow], int]:
        next_at = func.min(Session.starts_at).label("next_at")
        stmt = (
            select(
                Show.id,
                Show.title,
                Show.synopsis,
                Show.image_url,
                Show.genre_id,
                Genre.name.label("genre_name"),
                func.array_agg(
                    aggregate_order_by(distinct(Session.starts_at), Session.starts_at.asc())
                ).label("upcoming_dates"),
                func.min(Session.full_price_cents).label("price_min_cents"),
                func.max(Session.full_price_cents).label("price_max_cents"),
                next_at,
            )
            .join(Session, Session.show_id == Show.id)
            .join(Genre, Genre.id == Show.genre_id)
            .where(*self._filters(floor, genre_id))
            .group_by(Show.id, Genre.name)
            .order_by(next_at.asc(), Show.id.asc())
        )

        rows, total = await paginate(self._session, stmt, page=page, size=size)

        return [
            ShowCardRow(
                id=row.id,
                title=row.title,
                synopsis=row.synopsis,
                image_url=row.image_url,
                genre_id=row.genre_id,
                genre_name=row.genre_name,
                upcoming_dates=list(row.upcoming_dates),
                price_min_cents=row.price_min_cents,
                price_max_cents=row.price_max_cents,
            )
            for row in rows
        ], total

    @staticmethod
    def _filters(floor: datetime, genre_id: UUID | None) -> list:
        filters = [
            Show.is_active.is_(True),
            Show.status == ShowStatus.PUBLISHED,
            Session.is_active.is_(True),
            Session.status == SessionStatus.ON_SALE,
            Session.starts_at >= floor,
        ]

        if genre_id is not None:
            filters.append(Show.genre_id == genre_id)

        return filters

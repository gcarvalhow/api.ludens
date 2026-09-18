from __future__ import annotations

from typing import Sequence
from uuid import UUID

from sqlalchemy import select

from app.modules.catalog.domain.aggregates import Genre
from app.core.infrastructure.repositories import AggregateRepository

class GenreRepository(AggregateRepository[Genre]):
    model = Genre

    async def find_all_by_ids(self, ids: Sequence[UUID]) -> list[Genre]:
        # No is_active filter: this resolves display names for genre_ids a show
        # already references, regardless of whether the genre itself is still
        # active — an inactive genre referenced by a (still active) show from
        # before it was deactivated is a legitimate state, not a lookup miss.
        if not ids:
            return []

        result = await self._session.execute(select(Genre).where(Genre.id.in_(ids)))
        return list(result.scalars().all())

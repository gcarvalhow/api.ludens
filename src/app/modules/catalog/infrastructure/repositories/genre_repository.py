from __future__ import annotations

from typing import Sequence
from uuid import UUID

from sqlalchemy import select

from app.modules.catalog.domain.aggregates import Genre
from app.core.infrastructure.repositories import AggregateRepository

class GenreRepository(AggregateRepository[Genre]):
    model = Genre

    async def find_all_by_ids(self, ids: Sequence[UUID]) -> list[Genre]:
        if not ids:
            return []

        result = await self._session.execute(
            select(Genre).where(Genre.id.in_(ids), Genre.is_active == True)  # noqa: E712
        )
        return list(result.scalars().all())

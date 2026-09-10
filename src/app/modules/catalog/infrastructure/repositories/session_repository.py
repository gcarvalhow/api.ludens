from __future__ import annotations

from uuid import UUID

from sqlalchemy import select

from app.core.infrastructure.repositories.repository import AggregateRepository
from app.modules.catalog.domain.aggregates.session import Session


class SessionRepository(AggregateRepository[Session]):
    model = Session

    async def find_all_for_shows(self, show_ids: list[UUID]) -> list[Session]:
        if not show_ids:
            return []
        result = await self._session.execute(
            select(Session)
            .where(Session.show_id.in_(show_ids), Session.is_active.is_(True))
            .order_by(Session.starts_at.asc())
        )
        return list(result.scalars().all())

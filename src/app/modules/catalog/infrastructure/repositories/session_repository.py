from __future__ import annotations

from uuid import UUID
from sqlalchemy import select

from app.core.infrastructure.repositories import AggregateRepository
from app.modules.catalog.domain.aggregates import Session

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

    async def find_by_id_for_update(self, session_id: UUID) -> Session | None:
        # SELECT ... FOR UPDATE: trava a linha até o fim da transação — RN05,
        # necessário na edição/cancelamento/exclusão de sessão sob concorrência.
        result = await self._session.execute(
            select(Session)
            .where(Session.id == session_id, Session.is_active.is_(True))
            .with_for_update()
        )

        return result.scalar_one_or_none()

from __future__ import annotations

from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.domain.errors import NotFoundError

from app.modules.catalog.domain.aggregates import Session
from app.modules.catalog.application.schemas.request import SessionRequest
from app.modules.catalog.application.schemas.response import AdminSessionResponse
from app.modules.catalog.application.usecases.utils.money import cents_from_reais
from app.modules.catalog.application.usecases.utils.session_response import session_response
from app.modules.catalog.infrastructure.repositories import (
    SeatCounts,
    SeatCountsRepository,
    SessionRepository,
    ShowRepository,
)

class SessionUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._show_repository = ShowRepository(session)
        self._session_repository = SessionRepository(session)
        self._seat_counts_repository = SeatCountsRepository(session)

    async def create_session(self, show_id: UUID, req: SessionRequest) -> AdminSessionResponse:
        show = await self._show_repository.find_by("id", show_id)
        if show is None:
            raise NotFoundError("Espetáculo não encontrado.")

        now = datetime.now(timezone.utc)
        session = Session.create(
            show_id=show.id,
            starts_at=req.starts_at,
            venue=req.venue,
            capacity=req.capacity,
            full_price_cents=cents_from_reais(req.full_price),
            now=now,
        )

        await self._session_repository.save(session)
        return session_response(session, SeatCounts(0, 0), now)

    async def update_session(self, session_id: UUID, req: SessionRequest) -> AdminSessionResponse:
        session = await self._lock(session_id)
        counts = (await self._seat_counts_repository.for_sessions([session.id]))[session.id]
        now = datetime.now(timezone.utc)

        session.update(
            starts_at=req.starts_at,
            venue=req.venue,
            capacity=req.capacity,
            full_price_cents=cents_from_reais(req.full_price),
            committed=counts.tickets_sold + counts.reserved_open,
            now=now,
        )

        await self._session_repository.save(session)
        return session_response(session, counts, now)

    async def cancel_session(self, session_id: UUID) -> None:
        session = await self._lock(session_id)
        session.cancel()

        await self._session_repository.save(session)

    async def delete_session(self, session_id: UUID) -> None:
        session = await self._lock(session_id)
        counts = (await self._seat_counts_repository.for_sessions([session.id]))[session.id]

        session.deactivate(tickets_sold=counts.tickets_sold)
        await self._session_repository.save(session)

    async def _lock(self, session_id: UUID) -> Session:
        session = await self._session_repository.find_by_id_for_update(session_id)
        if session is None:
            raise NotFoundError("Sessão não encontrada.")

        return session

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.domain.errors import NotFoundError
from app.modules.catalog.application.schemas.request import (
    CreateSessionRequest,
    UpdateSessionRequest,
)
from app.modules.catalog.application.schemas.response import AdminSessionResponse
from app.modules.catalog.application.views import session_view
from app.modules.catalog.domain.aggregates.session import Session
from app.modules.catalog.domain.value_objects.money import Money
from app.modules.catalog.infrastructure.repositories import (
    SeatCounts,
    SeatCountsRepository,
    SessionRepository,
    ShowRepository,
)


class SessionAdminUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._show_repo = ShowRepository(session)
        self._session_repo = SessionRepository(session)
        self._seat_counts_repo = SeatCountsRepository(session)

    async def create_session(
        self, show_id: UUID, req: CreateSessionRequest
    ) -> AdminSessionResponse:
        show = await self._show_repo.find_by_id(show_id)
        if show is None:
            raise NotFoundError("Espetáculo não encontrado.")
        now = datetime.now(timezone.utc)
        session = Session.create(
            show_id=show.id,
            starts_at=req.starts_at,
            venue=req.venue,
            capacity=req.capacity,
            full_price=Money.from_reais(req.full_price),
            now=now,
        )
        await self._session_repo.save(session)
        return session_view(session, SeatCounts(0, 0), now)

    async def update_session(
        self, session_id: UUID, req: UpdateSessionRequest
    ) -> AdminSessionResponse:
        # Trava a linha da sessão antes de recontar/validar capacidade — o
        # mesmo mecanismo de RN05 que `booking` usa para reservar.
        session = await self._lock(session_id)
        counts = (await self._seat_counts_repo.for_sessions([session.id]))[session.id]
        now = datetime.now(timezone.utc)
        data = req.model_dump(exclude_unset=True)
        session.update(
            starts_at=data.get("starts_at", session.starts_at),
            venue=data.get("venue", session.venue),
            capacity=data.get("capacity", session.capacity),
            full_price=(
                Money.from_reais(data["full_price"])
                if "full_price" in data
                else session.full_price
            ),
            committed=counts.tickets_sold + counts.reserved_open,
            now=now,
        )
        await self._session_repo.save(session)
        return session_view(session, counts, now)

    async def cancel_session(self, session_id: UUID) -> None:
        session = await self._lock(session_id)
        session.cancel()
        await self._session_repo.save(session)

    async def delete_session(self, session_id: UUID) -> None:
        session = await self._lock(session_id)
        counts = (await self._seat_counts_repo.for_sessions([session.id]))[session.id]
        session.deactivate(tickets_sold=counts.tickets_sold)
        await self._session_repo.save(session)

    async def _lock(self, session_id: UUID) -> Session:
        session = await self._session_repo.find_by_id_for_update(session_id)
        if session is None:
            raise NotFoundError("Sessão não encontrada.")
        return session

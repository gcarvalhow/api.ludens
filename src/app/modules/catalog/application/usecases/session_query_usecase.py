from __future__ import annotations

from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.domain.errors import NotFoundError

from app.modules.catalog.domain.aggregates import Session, Show
from app.modules.catalog.domain.enumerations import SessionStatus, ShowStatus
from app.modules.catalog.application.schemas.response import (
    SessionDetailResponse,
    SessionShowRef,
    SessionSummaryResponse,
    ShowDetailResponse,
    TicketTypeResponse,
)
from app.modules.catalog.application.usecases.utils.money import reais_from_cents
from app.modules.catalog.infrastructure.repositories import (
    SeatCounts,
    SeatCountsRepository,
    SessionRepository,
    ShowRepository,
)

def _available_count(session: Session, counts: SeatCounts) -> int:
    # Disponível = capacidade − confirmados − reservas abertas não vencidas.
    # É leitura do instante, não garantia: a reserva revalida sob trava (RN05).
    return max(0, session.capacity - counts.tickets_sold - counts.reserved_open)

def _status(session: Session, available: int, now: datetime) -> str:
    if session.status is SessionStatus.CANCELLED:
        return "cancelled"
    if session.starts_at <= now:
        return "closed"
    if available <= 0:
        return "sold_out"

    return "on_sale"

def _summary(session: Session, counts: SeatCounts, now: datetime) -> SessionSummaryResponse:
    available = _available_count(session, counts)

    return SessionSummaryResponse(
        id=session.id,
        starts_at=session.starts_at,
        venue=session.venue,
        capacity=session.capacity,
        available_count=available,
        status=_status(session, available, now),
    )

class SessionQueryUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._show_repository = ShowRepository(session)
        self._session_repository = SessionRepository(session)
        self._seat_counts_repository = SeatCountsRepository(session)

    async def get_show_detail(self, show_id: UUID) -> ShowDetailResponse:
        show = await self._require_published_show(show_id)
        now = datetime.now(timezone.utc)

        sessions = [
            s
            for s in await self._session_repository.find_all_for_shows([show.id])
            if s.starts_at > now
        ]
        counts = await self._seat_counts_repository.for_sessions([s.id for s in sessions])

        return ShowDetailResponse(
            id=show.id,
            title=show.title,
            synopsis=show.synopsis,
            image_url=show.image_url,
            genre=show.genre,
            sessions=[
                _summary(s, counts.get(s.id, SeatCounts(0, 0)), now) for s in sessions
            ],
        )

    async def get_session_detail(self, session_id: UUID) -> SessionDetailResponse:
        session = await self._session_repository.find_by("id", session_id)
        if session is None:
            raise NotFoundError("Sessão não encontrada.")

        show = await self._require_published_show(session.show_id)
        counts = await self._seat_counts_repository.for_sessions([session.id])
        available = _available_count(session, counts.get(session.id, SeatCounts(0, 0)))

        return SessionDetailResponse(
            id=session.id,
            show=SessionShowRef(id=show.id, title=show.title),
            starts_at=session.starts_at,
            venue=session.venue,
            capacity=session.capacity,
            available_count=available,
            status=_status(session, available, datetime.now(timezone.utc)),
            ticket_types=[
                TicketTypeResponse(type="full", price=reais_from_cents(session.full_price_cents)),
                TicketTypeResponse(type="half", price=reais_from_cents(session.half_price_cents)),
            ],
        )

    async def _require_published_show(self, show_id: UUID) -> Show:
        show = await self._show_repository.find_by("id", show_id)

        # Espetáculo despublicado sai da vitrine e também não é navegável por
        # link direto — nem ele, nem as sessões dele.
        if show is None or show.status is not ShowStatus.PUBLISHED:
            raise NotFoundError("Espetáculo não encontrado.")

        return show

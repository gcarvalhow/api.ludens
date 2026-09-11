from __future__ import annotations

from datetime import datetime
from uuid import UUID

from app.modules.catalog.application.schemas.response import (
    AdminSessionResponse,
    AdminShowResponse,
)
from app.modules.catalog.domain.aggregates.session import Session
from app.modules.catalog.domain.aggregates.show import Show
from app.modules.catalog.domain.enumerations.session_status import SessionStatus
from app.modules.catalog.infrastructure.repositories import SeatCounts


def _session_status(session: Session, now: datetime) -> str:
    if session.status is SessionStatus.CANCELLED:
        return "cancelled"
    if session.starts_at <= now:
        return "closed"
    return "on_sale"


def session_view(session: Session, counts: SeatCounts, now: datetime) -> AdminSessionResponse:
    return AdminSessionResponse(
        id=session.id,
        show_id=session.show_id,
        starts_at=session.starts_at,
        venue=session.venue,
        capacity=session.capacity,
        full_price=session.full_price.reais,
        half_price=session.half_price.reais,
        status=_session_status(session, now),
        tickets_sold=counts.tickets_sold,
        reserved_open=counts.reserved_open,
        can_delete=counts.tickets_sold == 0,
    )


def show_view(
    show: Show,
    sessions: list[Session],
    counts_map: dict[UUID, SeatCounts],
    now: datetime,
) -> AdminShowResponse:
    return AdminShowResponse(
        id=show.id,
        title=show.title,
        synopsis=show.synopsis,
        image_url=show.image_url,
        genre=show.genre,
        status=show.status.value,
        sessions=[
            session_view(s, counts_map.get(s.id, SeatCounts(0, 0)), now) for s in sessions
        ],
    )

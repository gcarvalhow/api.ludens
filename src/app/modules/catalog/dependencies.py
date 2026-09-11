from __future__ import annotations

from uuid import UUID
from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.catalog.domain.aggregates import Session
from app.modules.catalog.infrastructure.repositories import (
    SeatCountsRepository,
    SessionRepository,
)

@dataclass(frozen=True)
class SessionRef:
    id: UUID
    capacity: int
    starts_at: datetime
    is_on_sale: bool

def _ref(session: Session, now: datetime) -> SessionRef:
    return SessionRef(
        id=session.id,
        capacity=session.capacity,
        starts_at=session.starts_at,
        is_on_sale=session.is_on_sale(now),
    )

async def get_session_ref(session: AsyncSession, session_id: UUID) -> SessionRef | None:
    found = await SessionRepository(session).find_by("id", session_id)
    if found is None:
        return None

    return _ref(found, datetime.now(timezone.utc))

async def lock_session_for_update(session: AsyncSession, session_id: UUID) -> SessionRef | None:
    # SELECT ... FOR UPDATE: a trava atravessa a fronteira de módulo pela porta,
    # não pelo import — booking não pode alcançar SessionRepository (RN05).
    locked = await SessionRepository(session).find_by_id_for_update(session_id)
    if locked is None:
        return None

    return _ref(locked, datetime.now(timezone.utc))

async def count_confirmed_tickets_for_session(session: AsyncSession, session_id: UUID) -> int:
    counts = await SeatCountsRepository(session).for_sessions([session_id])

    return counts[session_id].tickets_sold

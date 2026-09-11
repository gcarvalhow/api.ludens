from __future__ import annotations

import logging
from uuid import UUID
from typing import NamedTuple

from sqlalchemy import bindparam, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import OperationalError, ProgrammingError

logger = logging.getLogger(__name__)

class SeatCounts(NamedTuple):
    tickets_sold: int
    reserved_open: int

_SOLD_SQL = text(
    """
    SELECT session_id, COUNT(*) AS total
    FROM tickets
    WHERE session_id IN :ids AND is_active = true AND status = 'valid'
    GROUP BY session_id
    """
).bindparams(bindparam("ids", expanding=True))

_OPEN_SQL = text(
    """
    SELECT session_id, COALESCE(SUM(quantity), 0) AS total
    FROM reservations
    WHERE session_id IN :ids AND is_active = true
      AND status = 'open' AND expires_at > now()
    GROUP BY session_id
    """
).bindparams(bindparam("ids", expanding=True))

class SeatCountsRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def for_sessions(self, session_ids: list[UUID]) -> dict[UUID, SeatCounts]:
        base: dict[UUID, SeatCounts] = {sid: SeatCounts(0, 0) for sid in session_ids}
        if not session_ids:
            return base

        ids = [str(sid) for sid in session_ids]
        try:
            async with self._session.begin_nested():
                sold_rows = (await self._session.execute(_SOLD_SQL, {"ids": ids})).all()
                open_rows = (await self._session.execute(_OPEN_SQL, {"ids": ids})).all()
        except (ProgrammingError, OperationalError) as exc:
            logger.warning(
                "catalog: contagem de assentos indisponível (%s) — assumindo 0",
                exc.__class__.__name__,
            )

            return base

        sold = {UUID(str(row[0])): int(row[1]) for row in sold_rows}
        held = {UUID(str(row[0])): int(row[1]) for row in open_rows}

        return {sid: SeatCounts(sold.get(sid, 0), held.get(sid, 0)) for sid in session_ids}

from __future__ import annotations

from typing import Sequence

from sqlalchemy.sql import Select
from sqlalchemy.engine import Row
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

_TOTAL_LABEL = "__pagination_total"

async def paginate(session: AsyncSession, stmt: Select, *, page: int, size: int) -> tuple[Sequence[Row], int]:
    windowed = stmt.add_columns(func.count().over().label(_TOTAL_LABEL))
    paged = windowed.limit(size).offset((page - 1) * size)

    rows = (await session.execute(paged)).all()
    if not rows:
        counted = await session.execute(select(func.count()).select_from(stmt.subquery()))
        return [], int(counted.scalar_one())

    return rows, int(getattr(rows[0], _TOTAL_LABEL))

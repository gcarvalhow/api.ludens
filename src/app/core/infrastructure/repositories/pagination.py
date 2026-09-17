from __future__ import annotations

from sqlalchemy import Select, func, select
from sqlalchemy.engine import Row
from sqlalchemy.ext.asyncio import AsyncSession

async def paginate(session: AsyncSession, stmt: Select, *, page: int, size: int) -> tuple[list[Row], int]:
    windowed = stmt.add_columns(func.count().over().label("_total"))
    result = (await session.execute(windowed.limit(size).offset((page - 1) * size))).all()

    if not result:
        total = int((await session.execute(
            select(func.count()).select_from(stmt.order_by(None).subquery())
        )).scalar_one())
        return [], total

    return list(result), int(result[0]._total)

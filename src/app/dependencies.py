from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Uma transação por request: tudo que um usecase faz com esta sessão só
    vira COMMIT quando a request termina sem exceção (ver
    docs.ludens/backend/overview.md e a skill backend-architecture)."""
    async with AsyncSessionLocal() as session:
        async with session.begin():
            yield session

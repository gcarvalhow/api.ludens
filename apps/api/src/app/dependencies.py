from typing import AsyncGenerator

from app.database import AsyncSessionLocal
from sqlalchemy.ext.asyncio import AsyncSession

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        async with session.begin():
            yield session

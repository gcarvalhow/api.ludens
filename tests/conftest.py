import os
import pytest_asyncio

from app.core.domain import Model
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

# Must run before any `import app...`: Settings (src/app/config.py) requires
# DATABASE_URL and JWT_SECRET_KEY with no default, and modules imported by usecase
# tests (e.g. TokenService, identity.shared.session) touch app.config on import.
os.environ.setdefault(
    "DATABASE_URL", "postgresql+asyncpg://ludens:ludens@localhost:5433/ludens_test"
)
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-with-at-least-32-bytes-long")

@pytest_asyncio.fixture(scope="session")
async def engine():
    test_engine = create_async_engine(os.environ["DATABASE_URL"])

    async with test_engine.begin() as conn:
        await conn.run_sync(Model.metadata.create_all)

    yield test_engine

    async with test_engine.begin() as conn:
        await conn.run_sync(Model.metadata.drop_all)

    await test_engine.dispose()

@pytest_asyncio.fixture
async def session(engine):
    async with engine.connect() as conn:
        transaction = await conn.begin()
        async with AsyncSession(bind=conn, expire_on_commit=False) as db_session:
            yield db_session
        await transaction.rollback()

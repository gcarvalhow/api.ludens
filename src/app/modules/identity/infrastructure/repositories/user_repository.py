from sqlalchemy import select

from app.modules.identity.domain.aggregates import User
from app.core.infrastructure.repositories import AggregateRepository, paginate

class UserRepository(AggregateRepository[User]):
    model = User

    async def list_paginated(self, *, page: int, size: int) -> tuple[list[User], int]:
        stmt = select(User).where(User.is_active.is_(True)).order_by(User.created_at.desc())
        rows, total = await paginate(self._session, stmt, page=page, size=size)

        return [row[0] for row in rows], total

    async def count_active_admins(self) -> int:
        return len(await self.find_all_by(is_admin=True))

from datetime import datetime
from uuid import UUID

from app.core.infrastructure.repositories import BaseRepository
from app.modules.identity.domain.entities.account_deletion_token import AccountDeletionToken

class AccountDeletionTokenRepository(BaseRepository[AccountDeletionToken]):
    model = AccountDeletionToken

    async def invalidate_all_for_user(self, user_id: UUID, now: datetime) -> None:
        for token in await self.find_all_by(user_id=user_id):
            if token.used_at is None:
                token.used_at = now

from uuid import UUID

from app.core.infrastructure.repositories import BaseRepository
from app.modules.identity.domain.entities.refresh_token import RefreshToken

class RefreshTokenRepository(BaseRepository[RefreshToken]):
    model = RefreshToken

    async def deactivate_all_for_user(self, user_id: UUID) -> None:
        for token in await self.find_all_by(user_id=user_id):
            token.is_active = False

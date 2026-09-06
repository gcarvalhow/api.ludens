from datetime import datetime
from uuid import UUID

from app.core.infrastructure.repositories import BaseRepository
from app.modules.identity.domain.entities.password_reset_token import PasswordResetToken


class PasswordResetTokenRepository(BaseRepository[PasswordResetToken]):
    # Entidade filha: BaseRepository puro.
    model = PasswordResetToken

    async def find_by_token_hash(self, token_hash: str) -> PasswordResetToken | None:
        return await self.find_by("token_hash", token_hash)

    async def invalidate_all_for_buyer(self, buyer_id: UUID, now: datetime) -> None:
        # Cada nova solicitacao invalida os links anteriores — so' o ultimo vale.
        for token in await self.find_all_by(buyer_id=buyer_id):
            if token.used_at is None:
                token.used_at = now

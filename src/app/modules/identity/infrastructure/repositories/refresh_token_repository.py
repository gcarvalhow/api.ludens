from uuid import UUID

from app.core.infrastructure.repositories import BaseRepository
from app.modules.identity.domain.entities.refresh_token import RefreshToken


class RefreshTokenRepository(BaseRepository[RefreshToken]):
    # Entidade filha: BaseRepository puro, sem drenar eventos.
    model = RefreshToken

    async def find_by_token_hash(self, token_hash: str) -> RefreshToken | None:
        return await self.find_by("token_hash", token_hash)

    async def deactivate_all_for_buyer(self, buyer_id: UUID) -> None:
        # Logout / troca / reset de senha derrubam a sessao em todos os
        # dispositivos: desativa os refresh tokens do comprador (o access token
        # ja cai pela divergencia de security_stamp).
        for token in await self.find_all_by(buyer_id=buyer_id):
            token.is_active = False

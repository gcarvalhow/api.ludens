from datetime import datetime, timedelta, timezone

from app.config import settings
from app.modules.identity.application.schemas.response import TokenResponse
from app.modules.identity.domain.aggregates import User
from app.modules.identity.domain.entities.refresh_token import RefreshToken
from app.modules.identity.infrastructure.repositories.refresh_token_repository import RefreshTokenRepository
from app.modules.identity.infrastructure.services.token_service import TokenService

async def issue_session(
    user: User, token_service: TokenService, refresh_repository: RefreshTokenRepository
) -> tuple[TokenResponse, str]:
    access, expires_in = token_service.issue_access(user)
    raw_refresh = token_service.new_opaque_token()

    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)

    await refresh_repository.save(
        RefreshToken(
            user_id=user.id,
            token_hash=token_service.hash_opaque(raw_refresh),
            expires_at=expires_at,
        )
    )

    return TokenResponse(access_token=access, expires_in=expires_in), raw_refresh

from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.core.domain import AuthError, ForbiddenError
from app.modules.identity.domain.aggregates import User

from app.modules.identity.infrastructure.services import TokenService
from app.modules.identity.infrastructure.repositories import UserRepository

_bearer = HTTPBearer(auto_error=False)

async def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(_bearer), session: AsyncSession = Depends(get_db)) -> User:
    if credentials is None or not credentials.credentials:
        raise AuthError("Não autenticado.")

    payload = TokenService().decode_access(credentials.credentials)
    user = await UserRepository(session).find_by("id", UUID(payload["sub"]))

    if user is None or str(user.security_stamp) != payload.get("security_stamp"):
        raise AuthError("Sessão inválida ou expirada.")

    return user

async def require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise ForbiddenError("Acesso restrito a administradores.")

    return user

async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    session: AsyncSession = Depends(get_db),
) -> User | None:
    if credentials is None or not credentials.credentials:
        return None

    try:
        payload = TokenService().decode_access(credentials.credentials)
    except AuthError:
        return None

    user = await UserRepository(session).find_by("id", UUID(payload["sub"]))
    if user is None or str(user.security_stamp) != payload.get("security_stamp"):
        return None

    return user

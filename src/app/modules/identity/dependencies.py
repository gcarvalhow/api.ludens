from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.domain.errors import AuthError, ForbiddenError
from app.dependencies import get_db
from app.modules.identity.domain.aggregates.buyer import Buyer
from app.modules.identity.domain.enumerations.role import Role
from app.modules.identity.infrastructure.repositories import BuyerRepository
from app.modules.identity.infrastructure.services import TokenService

# Unica porta de entrada do modulo identity para os demais modulos: outros
# modulos importam daqui (nunca de domain/ ou infrastructure/ interno).

_bearer = HTTPBearer(auto_error=False)


async def get_current_buyer(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    session: AsyncSession = Depends(get_db),
) -> Buyer:
    if credentials is None or not credentials.credentials:
        raise AuthError("Não autenticado.")
    payload = TokenService().decode_access(credentials.credentials)
    buyer = await BuyerRepository(session).find_by_id(UUID(payload["sub"]))
    # Compara o security_stamp do token com o do banco: se divergir (logout,
    # troca/reset de senha), 401 mesmo com o JWT ainda valido.
    if buyer is None or str(buyer.security_stamp) != payload.get("security_stamp"):
        raise AuthError("Sessão inválida ou expirada.")
    return buyer


async def require_admin(buyer: Buyer = Depends(get_current_buyer)) -> Buyer:
    if buyer.role is not Role.ADMIN:
        raise ForbiddenError("Acesso restrito a administradores.")
    return buyer

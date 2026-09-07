from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.domain import ConflictError, NotFoundError

from app.modules.identity.domain.aggregates import User
from app.modules.identity.domain.value_objects import CPF, Email
from app.modules.identity.application.schemas.request import RegisterRequest
from app.modules.identity.application.schemas.response import TokenResponse, UserResponse
from app.modules.identity.application.usecases.utils.session import issue_session

from app.modules.identity.infrastructure.services import PasswordService, TokenService

from app.modules.identity.infrastructure.repositories import (
    RefreshTokenRepository,
    UserRepository
)

class UserUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

        self._user_repository = UserRepository(session)
        self._refresh_repository = RefreshTokenRepository(session)

        self._token_service = TokenService()
        self._password_service = PasswordService()

    async def register(self, req: RegisterRequest) -> tuple[TokenResponse, str]:
        cpf = CPF(req.cpf)
        email = Email(req.email.strip().lower())

        if await self._user_repository.exists_by("cpf", cpf.value):
            raise ConflictError("Este CPF já possui cadastro.")

        if await self._user_repository.exists_by("email", email.value):
            raise ConflictError("Este e-mail já está em uso.")

        user = User.register(req.name, cpf, email, self._password_service.hash(req.password))

        await self._user_repository.save(user)
        return await issue_session(user, self._token_service, self._refresh_repository)

    async def get_by_id(self, user_id: UUID) -> UserResponse:
        user = await self._user_repository.find_by("id", user_id)

        if user is None:
            raise NotFoundError("Usuário não encontrado.")

        return UserResponse(
            id=user.id, name=user.name, email=user.email, cpf=user.cpf, is_admin=user.is_admin
        )

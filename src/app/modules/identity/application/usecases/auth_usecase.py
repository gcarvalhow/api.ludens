from uuid import UUID
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.core.domain import AuthError, DomainError, GoneError

from app.modules.identity.domain.aggregates import User
from app.modules.identity.domain.entities.password_reset_token import PasswordResetToken

from app.modules.identity.application.schemas.response import TokenResponse
from app.modules.identity.application.usecases.utils.session import issue_session

from app.modules.identity.infrastructure.services import PasswordService, TokenService

from app.modules.identity.application.schemas.request import (
    LoginRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
    ForgotPasswordRequest
)

from app.modules.identity.infrastructure.repositories import (
    PasswordResetTokenRepository,
    RefreshTokenRepository,
    UserRepository
)

class AuthUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

        self._user_repository = UserRepository(session)
        self._refresh_repository = RefreshTokenRepository(session)
        self._password_reset_repository = PasswordResetTokenRepository(session)

        self._token_service = TokenService()
        self._password_service = PasswordService()

    async def login(self, req: LoginRequest) -> tuple[TokenResponse, str]:
        user = await self._user_repository.find_by("email", req.email.strip().lower())
        if user is None or not self._password_service.verify(req.password, user.password_hash):
            raise AuthError("E-mail ou senha inválidos.")
        
        return await issue_session(user, self._token_service, self._refresh_repository)

    async def logout(self, user: User) -> None:
        user.rotate_security_stamp()
        
        await self._user_repository.save(user)
        await self._refresh_repository.deactivate_all_for_user(user.id)

    async def refresh(self, raw_refresh: str | None) -> tuple[TokenResponse, str]:
        record = None

        if raw_refresh:
            token_hash = self._token_service.hash_opaque(raw_refresh)
            record = await self._refresh_repository.find_by("token_hash", token_hash)
            
        now = datetime.now(timezone.utc)
        if record is None or record.expires_at <= now:
            raise AuthError("Sessão expirada.")
        
        if record.used:
            await self._revoke_all_sessions(record.user_id)
            raise AuthError("Sessão expirada.")
        
        user = await self._user_repository.find_by("id", record.user_id)
        if user is None:
            raise AuthError("Sessão expirada.")
        
        record.mark_rotated()
        return await issue_session(user, self._token_service, self._refresh_repository)

    async def change_password(self, user: User, req: ChangePasswordRequest) -> None:
        if not self._password_service.verify(req.current_password, user.password_hash):
            raise DomainError("A senha atual não confere.")
        
        user.change_password(self._password_service.hash(req.new_password))

        await self._user_repository.save(user)
        await self._refresh_repository.deactivate_all_for_user(user.id)

    async def forgot_password(self, req: ForgotPasswordRequest) -> dict[str, str]:
        user = await self._user_repository.find_by("email", req.email.strip().lower())
        if user is not None:
            now = datetime.now(timezone.utc)
            await self._password_reset_repository.invalidate_all_for_user(user.id, now)

            raw = self._token_service.new_opaque_token()
            expires_at = now + timedelta(hours=1)

            await self._password_reset_repository.save(
                PasswordResetToken(
                    user_id=user.id,
                    token_hash=self._token_service.hash_opaque(raw),
                    expires_at=expires_at,
                )
            )

            user.request_password_reset(raw, expires_at)
            await self._user_repository.save(user)

        return {"message": "Se houver uma conta com esse e-mail, enviamos um link."}

    async def reset_password(self, req: ResetPasswordRequest) -> None:
        token_hash = self._token_service.hash_opaque(req.token)
        record = await self._password_reset_repository.find_by("token_hash", token_hash)

        now = datetime.now(timezone.utc)
        if record is None or not record.is_valid(now):
            raise GoneError("Este link não é mais válido, solicite um novo.")

        record.consume(now)
        user = await self._user_repository.find_by("id", record.user_id)

        if user is None:
            raise GoneError("Este link não é mais válido, solicite um novo.")
        
        user.reset_password(self._password_service.hash(req.password))

        await self._user_repository.save(user)
        await self._refresh_repository.deactivate_all_for_user(user.id)

    async def _revoke_all_sessions(self, user_id: UUID) -> None:
        async with AsyncSessionLocal() as session, session.begin():
            users = UserRepository(session)
            user = await users.find_by("id", user_id)

            if user is not None:
                user.rotate_security_stamp()
                
                await users.save(user)
                await RefreshTokenRepository(session).deactivate_all_for_user(user_id)

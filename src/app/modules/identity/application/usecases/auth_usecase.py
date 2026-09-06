from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.domain.errors import AuthError, ConflictError, DomainError, GoneError
from app.database import AsyncSessionLocal
from app.modules.identity.application.schemas.request import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
)
from app.modules.identity.application.schemas.response import (
    BuyerResponse,
    MessageResponse,
    TokenResponse,
)
from app.modules.identity.domain.aggregates.buyer import Buyer
from app.modules.identity.domain.entities.password_reset_token import PasswordResetToken
from app.modules.identity.domain.entities.refresh_token import RefreshToken
from app.modules.identity.domain.value_objects.cpf import CPF
from app.modules.identity.domain.value_objects.email import Email
from app.modules.identity.infrastructure.repositories import (
    BuyerRepository,
    PasswordResetTokenRepository,
    RefreshTokenRepository,
)
from app.modules.identity.infrastructure.services import PasswordHasher, TokenService

# Resposta neutra de "esqueci a senha": identica exista ou nao a conta.
_FORGOT_MESSAGE = "Se houver uma conta com esse e-mail, enviamos um link."
_RESET_TTL_HOURS = 1
_LINK_EXPIRED_MESSAGE = "Este link não é mais válido, solicite um novo."


class AuthUseCase:
    # Orquestra dominio + infraestrutura numa transacao (a de get_db). O hashing
    # bcrypt e a emissao/verificacao de JWT ficam nos servicos de infra.

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._buyers = BuyerRepository(session)
        self._refresh = RefreshTokenRepository(session)
        self._resets = PasswordResetTokenRepository(session)
        self._hasher = PasswordHasher()
        self._tokens = TokenService()

    async def register(self, req: RegisterRequest) -> tuple[TokenResponse, str]:
        cpf = CPF(req.cpf)  # valida DV -> DomainError (422)
        email = Email(req.email.strip().lower())
        if await self._buyers.exists_by("cpf", cpf.value):
            raise ConflictError("Este CPF já possui cadastro.")
        if await self._buyers.exists_by("email", email.value):
            raise ConflictError("Este e-mail já está em uso.")
        buyer = Buyer.register(req.name, cpf, email, self._hasher.hash(req.password))
        await self._buyers.save(buyer)
        return await self._issue_session(buyer)

    async def login(self, req: LoginRequest) -> tuple[TokenResponse, str]:
        buyer = await self._buyers.find_by_email(req.email.strip().lower())
        # Mesma mensagem para e-mail inexistente e senha errada (nao revela se o
        # e-mail existe).
        if buyer is None or not self._hasher.verify(req.password, buyer.password_hash):
            raise AuthError("E-mail ou senha inválidos.")
        return await self._issue_session(buyer)

    async def refresh(self, raw_refresh: str | None) -> tuple[TokenResponse, str]:
        record = None
        if raw_refresh:
            record = await self._refresh.find_by_token_hash(self._tokens.hash_opaque(raw_refresh))
        now = datetime.now(timezone.utc)
        if record is None or record.expires_at <= now:
            raise AuthError("Sessão expirada.")
        if record.used:
            # Reuso de um token ja rotacionado: possivel roubo. Regenera o
            # security_stamp e derruba todas as sessoes. A rotacao vai numa
            # sessao propria porque esta request sofre rollback ao levantar 401.
            await self._revoke_all_sessions(record.buyer_id)
            raise AuthError("Sessão expirada.")
        buyer = await self._buyers.find_by_id(record.buyer_id)
        if buyer is None:
            raise AuthError("Sessão expirada.")
        record.mark_rotated()
        return await self._issue_session(buyer)

    async def logout(self, buyer: Buyer) -> None:
        buyer.rotate_security_stamp()
        await self._buyers.save(buyer)
        await self._refresh.deactivate_all_for_buyer(buyer.id)

    async def change_password(self, buyer: Buyer, req: ChangePasswordRequest) -> None:
        if not self._hasher.verify(req.current_password, buyer.password_hash):
            raise DomainError("A senha atual não confere.")  # 422
        buyer.change_password(self._hasher.hash(req.new_password))
        await self._buyers.save(buyer)
        await self._refresh.deactivate_all_for_buyer(buyer.id)

    async def forgot_password(self, req: ForgotPasswordRequest) -> MessageResponse:
        buyer = await self._buyers.find_by_email(req.email.strip().lower())
        if buyer is not None:
            now = datetime.now(timezone.utc)
            await self._resets.invalidate_all_for_buyer(buyer.id, now)
            raw = self._tokens.new_opaque_token()
            expires_at = now + timedelta(hours=_RESET_TTL_HOURS)
            await self._resets.save(
                PasswordResetToken(
                    buyer_id=buyer.id,
                    token_hash=self._tokens.hash_opaque(raw),
                    expires_at=expires_at,
                )
            )
            # O Buyer levanta o evento; o e-mail sai por um handler de outbox do
            # modulo notification (nao bloqueia a resposta).
            buyer.request_password_reset(raw, expires_at)
            await self._buyers.save(buyer)
        return MessageResponse(message=_FORGOT_MESSAGE)

    async def reset_password(self, req: ResetPasswordRequest) -> None:
        record = await self._resets.find_by_token_hash(self._tokens.hash_opaque(req.token))
        if record is None:
            raise GoneError(_LINK_EXPIRED_MESSAGE)
        record.consume(datetime.now(timezone.utc))  # 410 se usado/expirado
        buyer = await self._buyers.find_by_id(record.buyer_id)
        if buyer is None:
            raise GoneError(_LINK_EXPIRED_MESSAGE)
        buyer.reset_password(self._hasher.hash(req.password))
        await self._buyers.save(buyer)
        await self._refresh.deactivate_all_for_buyer(buyer.id)

    async def me(self, buyer: Buyer) -> BuyerResponse:
        return BuyerResponse(
            id=buyer.id, name=buyer.name, email=buyer.email, cpf=buyer.cpf, role=buyer.role.value
        )

    async def _issue_session(self, buyer: Buyer) -> tuple[TokenResponse, str]:
        access, expires_in = self._tokens.issue_access(buyer)
        raw_refresh = self._tokens.new_opaque_token()
        expires_at = datetime.now(timezone.utc) + timedelta(
            days=settings.refresh_token_expire_days
        )
        await self._refresh.save(
            RefreshToken(
                buyer_id=buyer.id,
                token_hash=self._tokens.hash_opaque(raw_refresh),
                expires_at=expires_at,
            )
        )
        return TokenResponse(access_token=access, expires_in=expires_in), raw_refresh

    async def _revoke_all_sessions(self, buyer_id: UUID) -> None:
        # Transacao propria e ja commitada — a resposta 401 faz rollback da
        # transacao da request, mas a revogacao precisa persistir.
        async with AsyncSessionLocal() as session, session.begin():
            buyers = BuyerRepository(session)
            buyer = await buyers.find_by_id(buyer_id)
            if buyer is not None:
                buyer.rotate_security_stamp()
                await buyers.save(buyer)
                await RefreshTokenRepository(session).deactivate_all_for_buyer(buyer_id)

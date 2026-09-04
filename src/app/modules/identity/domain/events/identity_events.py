from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID

from app.core.domain.events import DomainEvent
from app.modules.identity.domain.enumerations.role import Role

# Eventos levantados pelo aggregate Buyer. Cada um vira uma linha na tabela
# `events` (outbox) na mesma transacao do save (ver AggregateRepository).
# As entidades RefreshToken/PasswordResetToken nao levantam eventos proprios —
# quem descreve o que mudou na conta e' sempre o Buyer.


@dataclass(frozen=True)
class BuyerRegistered(DomainEvent):
    id: UUID = field(kw_only=True)
    name: str = field(kw_only=True)
    cpf: str = field(kw_only=True)
    email: str = field(kw_only=True)
    password_hash: str = field(kw_only=True)
    role: Role = field(kw_only=True)
    security_stamp: UUID = field(kw_only=True)


@dataclass(frozen=True)
class BuyerPasswordChanged(DomainEvent):
    id: UUID = field(kw_only=True)
    password_hash: str = field(kw_only=True)


@dataclass(frozen=True)
class BuyerSecurityStampRotated(DomainEvent):
    id: UUID = field(kw_only=True)
    security_stamp: UUID = field(kw_only=True)


@dataclass(frozen=True)
class PasswordResetRequested(DomainEvent):
    # Consumido por um handler do modulo `notification` (feature separada), que
    # envia o e-mail com o link. O token vai em claro no payload para montar o
    # link — nunca e' logado nem devolvido pela API.
    id: UUID = field(kw_only=True)
    email: str = field(kw_only=True)
    token: str = field(kw_only=True)
    expires_at: datetime = field(kw_only=True)

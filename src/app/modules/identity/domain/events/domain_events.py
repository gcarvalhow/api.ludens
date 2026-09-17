from uuid import UUID
from datetime import datetime
from dataclasses import dataclass, field

from app.core.domain import DomainEvent

@dataclass(frozen=True)
class UserRegistered(DomainEvent):
    id: UUID = field(kw_only=True)
    name: str = field(kw_only=True)
    cpf: str = field(kw_only=True)
    email: str = field(kw_only=True)
    password_hash: str = field(kw_only=True)
    is_admin: bool = field(kw_only=True)
    security_stamp: UUID = field(kw_only=True)

@dataclass(frozen=True)
class UserPasswordChanged(DomainEvent):
    id: UUID = field(kw_only=True)
    password_hash: str = field(kw_only=True)

@dataclass(frozen=True)
class UserSecurityStampRotated(DomainEvent):
    id: UUID = field(kw_only=True)
    security_stamp: UUID = field(kw_only=True)

@dataclass(frozen=True)
class PasswordResetRequested(DomainEvent):
    id: UUID = field(kw_only=True)
    email: str = field(kw_only=True)
    token: str = field(kw_only=True)
    expires_at: datetime = field(kw_only=True)

@dataclass(frozen=True)
class UserProfileUpdated(DomainEvent):
    id: UUID = field(kw_only=True)
    name: str = field(kw_only=True)

@dataclass(frozen=True)
class EmailChangeRequested(DomainEvent):
    id: UUID = field(kw_only=True)
    old_email: str = field(kw_only=True)
    new_email: str = field(kw_only=True)
    token: str = field(kw_only=True)
    expires_at: datetime = field(kw_only=True)

@dataclass(frozen=True)
class EmailChanged(DomainEvent):
    id: UUID = field(kw_only=True)
    new_email: str = field(kw_only=True)

@dataclass(frozen=True)
class AccountDeletionRequested(DomainEvent):
    id: UUID = field(kw_only=True)
    email: str = field(kw_only=True)
    token: str = field(kw_only=True)
    expires_at: datetime = field(kw_only=True)

@dataclass(frozen=True)
class UserDeactivated(DomainEvent):
    id: UUID = field(kw_only=True)

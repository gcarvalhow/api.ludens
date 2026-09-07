from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.domain import AggregateRoot, DomainEvent, Model
from app.modules.identity.domain.events import (
    PasswordResetRequested,
    UserPasswordChanged,
    UserRegistered,
    UserSecurityStampRotated,
)

from app.modules.identity.domain.value_objects import CPF, Email

class User(AggregateRoot, Model):
    __tablename__ = "users"

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    cpf: Mapped[str] = mapped_column(String(11), nullable=False)
    email: Mapped[str] = mapped_column(String(254), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(60), nullable=False)

    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    security_stamp: Mapped[UUID] = mapped_column(default=uuid4, nullable=False)

    @classmethod
    def register(cls, name: str, cpf: CPF, email: Email, password_hash: str, is_admin: bool = False) -> User:
        user = cls()
        user.raise_event(
            lambda v: UserRegistered(
                version=v,
                id=uuid4(),
                name=name,
                cpf=cpf.value,
                email=email.value,
                password_hash=password_hash,
                is_admin=is_admin,
                security_stamp=uuid4(),
            )
        )

        return user

    def change_password(self, new_hash: str) -> None:
        self.raise_event(
            lambda v: UserPasswordChanged(version=v, id=self.id, password_hash=new_hash)
        )
        self.rotate_security_stamp()

    def reset_password(self, new_hash: str) -> None:
        self.raise_event(
            lambda v: UserPasswordChanged(version=v, id=self.id, password_hash=new_hash)
        )
        self.rotate_security_stamp()

    def rotate_security_stamp(self) -> None:
        self.raise_event(
            lambda v: UserSecurityStampRotated(version=v, id=self.id, security_stamp=uuid4())
        )

    def request_password_reset(self, token: str, expires_at: datetime) -> None:
        self.raise_event(
            lambda v: PasswordResetRequested(
                version=v, id=self.id, email=self.email, token=token, expires_at=expires_at
            )
        )

    def _apply(self, event: DomainEvent) -> None:
        handler = getattr(self, f"_when_{type(event).__name__}", None)
        if handler:
            handler(event)

    def _when_UserRegistered(self, e: UserRegistered) -> None:
        self.id = e.id
        self.name = e.name
        self.cpf = e.cpf
        self.email = e.email
        self.password_hash = e.password_hash
        self.is_admin = e.is_admin
        self.security_stamp = e.security_stamp

    def _when_UserPasswordChanged(self, e: UserPasswordChanged) -> None:
        self.password_hash = e.password_hash

    def _when_UserSecurityStampRotated(self, e: UserSecurityStampRotated) -> None:
        self.security_stamp = e.security_stamp

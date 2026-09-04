from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Enum as SAEnum
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.domain.aggregate import AggregateRoot
from app.core.domain.events import DomainEvent
from app.core.domain.model import Model
from app.modules.identity.domain.enumerations.role import Role
from app.modules.identity.domain.events.identity_events import (
    BuyerPasswordChanged,
    BuyerRegistered,
    BuyerSecurityStampRotated,
    PasswordResetRequested,
)
from app.modules.identity.domain.value_objects.cpf import CPF
from app.modules.identity.domain.value_objects.email import Email


class Buyer(AggregateRoot, Model):
    # Aggregate root da conta do comprador. So' muda de estado pelos proprios
    # metodos (register/change_password/reset_password/rotate_security_stamp),
    # nunca por atribuicao direta de campo por fora.
    __tablename__ = "buyers"

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    cpf: Mapped[str] = mapped_column(String(11), nullable=False)
    email: Mapped[str] = mapped_column(String(254), nullable=False)
    # bcrypt gera hash de 60 caracteres.
    password_hash: Mapped[str] = mapped_column(String(60), nullable=False)
    role: Mapped[Role] = mapped_column(
        SAEnum(Role, name="buyer_role", values_callable=lambda enum: [m.value for m in enum]),
        default=Role.BUYER,
        nullable=False,
    )
    # Incluido no claim do access token; regenerado no logout e na troca/reset de
    # senha — invalida todos os tokens emitidos antes.
    security_stamp: Mapped[UUID] = mapped_column(default=uuid4, nullable=False)

    @classmethod
    def register(
        cls, name: str, cpf: CPF, email: Email, password_hash: str, role: Role = Role.BUYER
    ) -> Buyer:
        # O id e' gerado no evento (nao pelo default da coluna, que so' vale no
        # flush): o AggregateRepository.save le buyer.id para gravar a linha
        # Event antes do flush.
        buyer = cls()
        buyer.raise_event(
            lambda v: BuyerRegistered(
                version=v,
                id=uuid4(),
                name=name,
                cpf=cpf.value,
                email=email.value,
                password_hash=password_hash,
                role=role,
                security_stamp=uuid4(),
            )
        )
        return buyer

    def change_password(self, new_hash: str) -> None:
        self.raise_event(
            lambda v: BuyerPasswordChanged(version=v, id=self.id, password_hash=new_hash)
        )
        self.rotate_security_stamp()

    def reset_password(self, new_hash: str) -> None:
        self.raise_event(
            lambda v: BuyerPasswordChanged(version=v, id=self.id, password_hash=new_hash)
        )
        self.rotate_security_stamp()

    def rotate_security_stamp(self) -> None:
        self.raise_event(
            lambda v: BuyerSecurityStampRotated(version=v, id=self.id, security_stamp=uuid4())
        )

    def request_password_reset(self, token: str, expires_at: datetime) -> None:
        # Nao muda estado do Buyer — apenas emite o efeito (envio de e-mail) para
        # o outbox. O handler vive no modulo notification.
        self.raise_event(
            lambda v: PasswordResetRequested(
                version=v, id=self.id, email=self.email, token=token, expires_at=expires_at
            )
        )

    def _apply(self, event: DomainEvent) -> None:
        handler = getattr(self, f"_when_{type(event).__name__}", None)
        if handler:
            handler(event)

    def _when_BuyerRegistered(self, e: BuyerRegistered) -> None:
        self.id = e.id
        self.name = e.name
        self.cpf = e.cpf
        self.email = e.email
        self.password_hash = e.password_hash
        self.role = e.role
        self.security_stamp = e.security_stamp

    def _when_BuyerPasswordChanged(self, e: BuyerPasswordChanged) -> None:
        self.password_hash = e.password_hash

    def _when_BuyerSecurityStampRotated(self, e: BuyerSecurityStampRotated) -> None:
        self.security_stamp = e.security_stamp

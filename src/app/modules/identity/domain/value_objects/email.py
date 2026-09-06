import re
from dataclasses import dataclass

from app.core.domain.errors import DomainError

# Validacao de forma suficiente para o MVP (o e-mail e' o identificador de
# login). A confirmacao de posse do e-mail acontece na recuperacao de senha, nao
# no cadastro (ver escopo negativo da spec identity-auth).
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@dataclass(frozen=True)
class Email:
    value: str

    def __post_init__(self) -> None:
        if not _EMAIL_RE.match(self.value):
            raise DomainError("E-mail inválido.")

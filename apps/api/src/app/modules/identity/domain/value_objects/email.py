import re
from dataclasses import dataclass

from app.core.domain import DomainError

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

@dataclass(frozen=True)
class Email:
    value: str

    def __post_init__(self) -> None:
        if not _EMAIL_RE.match(self.value):
            raise DomainError("E-mail inválido.")

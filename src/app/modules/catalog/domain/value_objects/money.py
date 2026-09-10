from __future__ import annotations

from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal


from app.core.domain.errors import DomainError


@dataclass(frozen=True)
class Money:
    """Valor monetário em centavos — evita float em preço."""

    cents: int

    def __post_init__(self) -> None:
        if not isinstance(self.cents, int):
            raise DomainError("valor monetário deve ser inteiro de centavos")
        if self.cents < 0:
            raise DomainError("valor monetário não pode ser negativo")

    @classmethod
    def from_reais(cls, value: float | str | Decimal) -> "Money":
        cents = (Decimal(str(value)) * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
        return cls(cents=int(cents))

    @classmethod
    def zero(cls) -> "Money":
        return cls(cents=0)

    @property
    def reais(self) -> float:
        return self.cents / 100

    def half(self) -> "Money":
        # Meia-entrada = 50% do inteira, truncado ao centavo (RN04). Derivado,
        # nunca digitado pelo admin.
        return Money(cents=self.cents // 2)

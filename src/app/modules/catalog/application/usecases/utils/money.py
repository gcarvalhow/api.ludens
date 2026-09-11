from decimal import ROUND_HALF_UP, Decimal

def cents_from_reais(value: float) -> int:
    return int((Decimal(str(value)) * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))

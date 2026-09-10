from __future__ import annotations

import enum


class SessionStatus(str, enum.Enum):
    # "encerrada" é derivada de starts_at (não é um valor persistido);
    # "inativa" (excluída) é is_active=False no Model.
    ON_SALE = "on_sale"
    CANCELLED = "cancelled"

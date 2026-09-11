from __future__ import annotations

import enum

class SessionStatus(str, enum.Enum):
    ON_SALE = "on_sale"
    CANCELLED = "cancelled"

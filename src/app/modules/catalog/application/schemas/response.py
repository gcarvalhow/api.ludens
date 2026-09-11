from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from app.core.shared.schema import CamelModel


class AdminSessionResponse(CamelModel):
    id: UUID
    show_id: UUID
    starts_at: datetime
    venue: str
    capacity: int
    full_price: float
    half_price: float
    # Derivado: "closed" quando starts_at já passou; "cancelled" quando
    # cancelada; senão "on_sale".
    status: Literal["on_sale", "closed", "cancelled"]
    tickets_sold: int
    reserved_open: int
    can_delete: bool


class AdminShowResponse(CamelModel):
    id: UUID
    title: str
    synopsis: str
    image_url: str
    genre: str
    status: Literal["draft", "published"]
    sessions: list[AdminSessionResponse]

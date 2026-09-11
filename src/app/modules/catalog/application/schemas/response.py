from __future__ import annotations

from uuid import UUID
from typing import Literal
from datetime import datetime

from pydantic import BaseModel

class AdminSessionResponse(BaseModel):
    id: UUID
    show_id: UUID
    starts_at: datetime
    venue: str
    capacity: int
    full_price: float
    half_price: float
    status: Literal["on_sale", "closed", "cancelled"]
    tickets_sold: int
    reserved_open: int
    can_delete: bool

class AdminShowSummaryResponse(BaseModel):
    id: UUID
    title: str
    synopsis: str
    image_url: str
    genre: str
    status: Literal["draft", "published"]

class AdminShowResponse(AdminShowSummaryResponse):
    sessions: list[AdminSessionResponse]

class ShowCardResponse(BaseModel):
    id: UUID
    title: str
    synopsis_short: str
    image_url: str
    genre: str
    upcoming_dates: list[datetime]
    price_min: float
    price_max: float

class PagedShowsResponse(BaseModel):
    items: list[ShowCardResponse]
    page: int
    size: int
    total: int

class GenreResponse(BaseModel):
    slug: str
    label: str

class SessionSummaryResponse(BaseModel):
    id: UUID
    starts_at: datetime
    venue: str
    capacity: int
    available_count: int
    status: Literal["on_sale", "sold_out", "closed", "cancelled"]

class ShowDetailResponse(BaseModel):
    id: UUID
    title: str
    synopsis: str
    image_url: str
    genre: str
    sessions: list[SessionSummaryResponse]

class TicketTypeResponse(BaseModel):
    type: Literal["full", "half"]
    price: float

class SessionShowRef(BaseModel):
    id: UUID
    title: str

class SessionDetailResponse(BaseModel):
    id: UUID
    show: SessionShowRef
    starts_at: datetime
    venue: str
    capacity: int
    available_count: int
    status: Literal["on_sale", "sold_out", "closed", "cancelled"]
    ticket_types: list[TicketTypeResponse]

from __future__ import annotations

from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

class GenreRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)

    @field_validator("name")
    @classmethod
    def _strip(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("nome do gênero não pode ser vazio")
        return stripped

class ShowRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    synopsis: str = Field(min_length=1, max_length=5000)
    genre_id: UUID

class SessionRequest(BaseModel):
    show_id: UUID = Field(description="Ignorado em PUT — sessão não muda de show após criada.")
    starts_at: datetime
    venue: str = Field(min_length=1, max_length=200)
    capacity: int = Field(gt=0, le=100_000)
    full_price: float = Field(gt=0)

    @field_validator("starts_at")
    @classmethod
    def _tz_aware(cls, value: datetime) -> datetime:
        if value.tzinfo is None:
            raise ValueError("informe a data com fuso horário (ISO 8601 com offset)")
        return value

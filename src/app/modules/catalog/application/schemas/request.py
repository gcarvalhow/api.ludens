from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field, field_validator

class ShowRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    synopsis: str = Field(min_length=1, max_length=5000)
    genre: str = Field(min_length=1, max_length=80)

class SessionRequest(BaseModel):
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

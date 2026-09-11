from __future__ import annotations

from datetime import datetime

from pydantic import Field, field_validator

from app.core.shared.schema import CamelModel


class CreateShowRequest(CamelModel):
    title: str = Field(min_length=1, max_length=200)
    synopsis: str = Field(min_length=1, max_length=5000)
    image_url: str = Field(min_length=1, max_length=2048)
    genre: str = Field(min_length=1, max_length=80)


class UpdateShowRequest(CamelModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    synopsis: str | None = Field(default=None, min_length=1, max_length=5000)
    image_url: str | None = Field(default=None, min_length=1, max_length=2048)
    genre: str | None = Field(default=None, min_length=1, max_length=80)


class CreateSessionRequest(CamelModel):
    starts_at: datetime
    venue: str = Field(min_length=1, max_length=200)
    capacity: int = Field(gt=0, le=100_000)
    full_price: float = Field(gt=0)

    @field_validator("starts_at")
    @classmethod
    def _tz_aware(cls, value: datetime) -> datetime:
        # A regra "futura" é do domínio (precisa de `now`); aqui só a forma.
        if value.tzinfo is None:
            raise ValueError("informe a data com fuso horário (ISO 8601 com offset)")
        return value


class UpdateSessionRequest(CamelModel):
    starts_at: datetime | None = None
    venue: str | None = Field(default=None, min_length=1, max_length=200)
    capacity: int | None = Field(default=None, gt=0, le=100_000)
    full_price: float | None = Field(default=None, gt=0)

    @field_validator("starts_at")
    @classmethod
    def _tz_aware(cls, value: datetime | None) -> datetime | None:
        if value is not None and value.tzinfo is None:
            raise ValueError("informe a data com fuso horário (ISO 8601 com offset)")
        return value

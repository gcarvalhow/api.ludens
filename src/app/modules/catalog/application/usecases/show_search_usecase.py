from __future__ import annotations

import re
import unicodedata
from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.catalog.application.schemas.response import (
    GenreResponse,
    PagedShowsResponse,
    ShowCardResponse,
)
from app.modules.catalog.application.usecases.utils.money import reais_from_cents
from app.modules.catalog.infrastructure.repositories import ShowCardRow, ShowRepository

_SYNOPSIS_MAX = 160
_UPCOMING_DATES_MAX = 5

# Horário de Brasília. Offset fixo, não ZoneInfo: o Brasil não observa horário de
# verão desde 2019, e ZoneInfo exigiria o pacote `tzdata` no Windows.
_CATALOG_TZ = timezone(timedelta(hours=-3))

def _synopsis_short(synopsis: str) -> str:
    if len(synopsis) <= _SYNOPSIS_MAX:
        return synopsis

    return synopsis[: _SYNOPSIS_MAX - 1].rstrip() + "…"

def _slugify(genre: str) -> str:
    ascii_only = unicodedata.normalize("NFKD", genre).encode("ascii", "ignore").decode("ascii")

    return re.sub(r"[^a-z0-9]+", "-", ascii_only.lower()).strip("-")

def _floor_from(from_date: date | None) -> datetime:
    now = datetime.now(timezone.utc)
    if from_date is None:
        return now

    # A data vem do calendário do visitante, não em UTC: "a partir de 13/09" tem
    # que começar à meia-noite de Brasília, senão pega a noite do dia 12.
    # Data no passado não faz sentido para sessão futura — o piso nunca recua.
    return max(datetime.combine(from_date, time.min, tzinfo=_CATALOG_TZ), now)

def _card(row: ShowCardRow) -> ShowCardResponse:
    return ShowCardResponse(
        id=row.id,
        title=row.title,
        synopsis_short=_synopsis_short(row.synopsis),
        image_url=row.image_url,
        genre=row.genre,
        upcoming_dates=row.upcoming_dates[:_UPCOMING_DATES_MAX],
        price_min=reais_from_cents(row.price_min_cents),
        price_max=reais_from_cents(row.price_max_cents),
    )

class ShowSearchUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._show_repository = ShowRepository(session)

    async def search(
        self, *, from_date: date | None, genre: str | None, page: int, size: int
    ) -> PagedShowsResponse:
        floor = _floor_from(from_date)
        genres: list[str] | None = None

        if genre is not None:
            genres = await self._resolve_genres(genre, floor)
            if not genres:
                return PagedShowsResponse(items=[], page=page, size=size, total=0)

        result = await self._show_repository.search_with_upcoming(
            floor=floor, genres=genres, page=page, size=size
        )

        return PagedShowsResponse(
            items=[_card(row) for row in result.rows], page=page, size=size, total=result.total
        )

    async def list_genres(self) -> list[GenreResponse]:
        labels = await self._show_repository.list_genres_in_catalog(
            floor=datetime.now(timezone.utc)
        )

        # Rótulos distintos podem colidir no mesmo slug ("Comédia"/"comedia").
        # O filtro casa por slug, então a vitrine não pode oferecer slug repetido.
        by_slug: dict[str, str] = {}
        for label in labels:
            by_slug.setdefault(_slugify(label), label)

        return [GenreResponse(slug=slug, label=label) for slug, label in by_slug.items()]

    async def _resolve_genres(self, slug: str, floor: datetime) -> list[str]:
        # O gênero é texto livre no domínio; o contrato expõe slug. Casa em lista
        # para cobrir os rótulos que compartilham o mesmo slug.
        labels = await self._show_repository.list_genres_in_catalog(floor=floor)

        return [label for label in labels if _slugify(label) == slug]

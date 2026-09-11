from __future__ import annotations

import re
import unicodedata
from datetime import date, datetime, time, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.catalog.application.schemas.response import (
    GenreResponse,
    PagedShowsResponse,
    ShowCardResponse,
)
from app.modules.catalog.infrastructure.repositories import ShowCardRow, ShowRepository

_SYNOPSIS_MAX = 160

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

    # Data no passado não faz sentido para sessão futura — vira "a partir de agora".
    return max(datetime.combine(from_date, time.min, tzinfo=timezone.utc), now)

def _card(row: ShowCardRow) -> ShowCardResponse:
    return ShowCardResponse(
        id=row.id,
        title=row.title,
        synopsis_short=_synopsis_short(row.synopsis),
        image_url=row.image_url,
        genre=row.genre,
        upcoming_dates=row.upcoming_dates,
        price_min=row.price_min_cents / 100,
        price_max=row.price_max_cents / 100,
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

        return [GenreResponse(slug=_slugify(label), label=label) for label in labels]

    async def _resolve_genres(self, slug: str, floor: datetime) -> list[str]:
        # O gênero é texto livre no domínio; o contrato expõe slug. Dois rótulos
        # podem gerar o mesmo slug ("Comédia"/"comedia"), por isso casa em lista.
        labels = await self._show_repository.list_genres_in_catalog(floor=floor)

        return [label for label in labels if _slugify(label) == slug]

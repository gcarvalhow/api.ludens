from app.modules.catalog.application.schemas.response import ShowCardResponse
from app.modules.catalog.infrastructure.queries import ShowCardRow
from app.core.shared import reais_from_cents

_SYNOPSIS_MAX = 160
_UPCOMING_DATES_MAX = 5

def synopsis_short(synopsis: str) -> str:
    if len(synopsis) <= _SYNOPSIS_MAX:
        return synopsis

    return synopsis[: _SYNOPSIS_MAX - 1].rstrip() + "…"

def card_response(row: ShowCardRow) -> ShowCardResponse:
    return ShowCardResponse(
        id=row.id,
        title=row.title,
        synopsis_short=synopsis_short(row.synopsis),
        image_url=row.image_url,
        genre=row.genre,
        upcoming_dates=row.upcoming_dates[:_UPCOMING_DATES_MAX],
        price_min=reais_from_cents(row.price_min_cents),
        price_max=reais_from_cents(row.price_max_cents),
    )

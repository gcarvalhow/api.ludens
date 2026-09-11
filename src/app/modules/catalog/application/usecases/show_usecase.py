from __future__ import annotations

import random
from uuid import UUID
from datetime import date, datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.domain.errors import ConflictError, NotFoundError

from app.modules.catalog.domain.aggregates import Session, Show
from app.modules.catalog.application.schemas.request import ShowRequest
from app.modules.catalog.application.schemas.response import (
    AdminShowResponse,
    AdminShowSummaryResponse,
    GenreResponse,
    PagedShowsResponse,
    SessionSummaryResponse,
    ShowDetailResponse,
)
from app.modules.catalog.application.usecases.utils.genre_slug import slugify
from app.modules.catalog.application.usecases.utils.show_card import card_response
from app.modules.catalog.application.usecases.utils.search_floor import floor_from
from app.modules.catalog.application.usecases.utils.published_show import require_published_show
from app.modules.catalog.application.usecases.utils.session_response import session_response
from app.modules.catalog.application.usecases.utils.session_availability import (
    available_count,
    session_status,
)

from app.modules.catalog.infrastructure.repositories import (
    SeatCounts,
    SeatCountsRepository,
    SessionRepository,
    ShowRepository,
)

_DEFAULT_SHOW_IMAGES = [
    "/images/show-placeholders/1.jpg",
    "/images/show-placeholders/2.jpg",
    "/images/show-placeholders/3.jpg",
    "/images/show-placeholders/4.jpg",
    "/images/show-placeholders/5.jpg",
    "/images/show-placeholders/6.jpg",
]

def _show_response(show: Show, sessions: list[Session], counts_map: dict[UUID, SeatCounts], now: datetime) -> AdminShowResponse:
    return AdminShowResponse(
        id=show.id,
        title=show.title,
        synopsis=show.synopsis,
        image_url=show.image_url,
        genre=show.genre,
        status=show.status.value,
        sessions=[
            session_response(s, counts_map.get(s.id, SeatCounts(0, 0)), now) for s in sessions
        ],
    )

def _show_summary(show: Show) -> AdminShowSummaryResponse:
    return AdminShowSummaryResponse(
        id=show.id,
        title=show.title,
        synopsis=show.synopsis,
        image_url=show.image_url,
        genre=show.genre,
        status=show.status.value,
    )

def _session_summary(session: Session, counts: SeatCounts, now: datetime) -> SessionSummaryResponse:
    available = available_count(session, counts)

    return SessionSummaryResponse(
        id=session.id,
        starts_at=session.starts_at,
        venue=session.venue,
        capacity=session.capacity,
        available_count=available,
        status=session_status(session, available, now),
    )

class ShowUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._show_repository = ShowRepository(session)
        self._session_repository = SessionRepository(session)
        self._seat_counts_repository = SeatCountsRepository(session)

    async def list_shows(self) -> list[AdminShowSummaryResponse]:
        shows = await self._show_repository.find_all(order_by=["-created_at"])
        return [_show_summary(show) for show in shows]

    async def get_show(self, show_id: UUID) -> AdminShowResponse:
        show = await self._require_show(show_id)
        return await self._view_for(show)

    async def create_show(self, req: ShowRequest) -> AdminShowResponse:
        show = Show.create(
            title=req.title,
            synopsis=req.synopsis,
            image_url=random.choice(_DEFAULT_SHOW_IMAGES),
            genre=req.genre,
        )

        await self._show_repository.save(show)
        return _show_response(show, [], {}, datetime.now(timezone.utc))

    async def update_show(self, show_id: UUID, req: ShowRequest) -> AdminShowResponse:
        show = await self._require_show(show_id)
        show.update(
            title=req.title,
            synopsis=req.synopsis,
            image_url=show.image_url,
            genre=req.genre,
        )

        await self._show_repository.save(show)
        return await self._view_for(show)

    async def publish_show(self, show_id: UUID) -> None:
        show = await self._require_show(show_id)
        show.publish()

        await self._show_repository.save(show)

    async def unpublish_show(self, show_id: UUID) -> None:
        show = await self._require_show(show_id)
        show.unpublish()

        await self._show_repository.save(show)

    async def delete_show(self, show_id: UUID) -> None:
        show = await self._require_show(show_id)
        sessions = await self._session_repository.find_all_for_shows([show.id])
        counts = await self._seat_counts_repository.for_sessions([s.id for s in sessions])

        if any(counts.get(s.id, SeatCounts(0, 0)).tickets_sold > 0 for s in sessions):
            raise ConflictError(
                "Cancele as sessões com ingressos vendidos antes de excluir o espetáculo."
            )

        show.deactivate()
        await self._show_repository.save(show)

    async def search(self, *, from_date: date | None, genre: str | None, page: int, size: int) -> PagedShowsResponse:
        floor = floor_from(from_date)
        genres: list[str] | None = None

        if genre is not None:
            genres = await self._resolve_genres(genre, floor)
            if not genres:
                return PagedShowsResponse(items=[], page=page, size=size, total=0)

        result = await self._show_repository.search_with_upcoming(
            floor=floor, genres=genres, page=page, size=size
        )

        return PagedShowsResponse(
            items=[card_response(row) for row in result.rows],
            page=page,
            size=size,
            total=result.total,
        )

    async def list_genres(self) -> list[GenreResponse]:
        labels = await self._show_repository.list_genres_in_catalog(
            floor=datetime.now(timezone.utc)
        )

        by_slug: dict[str, str] = {}
        for label in labels:
            by_slug.setdefault(slugify(label), label)

        return [GenreResponse(slug=slug, label=label) for slug, label in by_slug.items()]

    async def get_show_detail(self, show_id: UUID) -> ShowDetailResponse:
        show = await require_published_show(self._show_repository, show_id)
        now = datetime.now(timezone.utc)

        sessions = [
            s
            for s in await self._session_repository.find_all_for_shows([show.id])
            if s.starts_at > now
        ]
        counts = await self._seat_counts_repository.for_sessions([s.id for s in sessions])

        return ShowDetailResponse(
            id=show.id,
            title=show.title,
            synopsis=show.synopsis,
            image_url=show.image_url,
            genre=show.genre,
            sessions=[
                _session_summary(s, counts.get(s.id, SeatCounts(0, 0)), now) for s in sessions
            ],
        )

    async def _resolve_genres(self, slug: str, floor: datetime) -> list[str]:
        labels = await self._show_repository.list_genres_in_catalog(floor=floor)
        return [label for label in labels if slugify(label) == slug]

    async def _require_show(self, show_id: UUID) -> Show:
        show = await self._show_repository.find_by("id", show_id)
        if show is None:
            raise NotFoundError("Espetáculo não encontrado.")

        return show

    async def _view_for(self, show: Show) -> AdminShowResponse:
        sessions = await self._session_repository.find_all_for_shows([show.id])
        counts = await self._seat_counts_repository.for_sessions([s.id for s in sessions])

        return _show_response(show, sessions, counts, datetime.now(timezone.utc))

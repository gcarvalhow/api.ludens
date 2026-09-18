from __future__ import annotations

import random
from uuid import UUID
from datetime import date, datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.domain.errors import ConflictError, NotFoundError
from app.core.shared import Page, PaginationParams

from app.modules.catalog.domain.aggregates import SeatCounts, Session, Show
from app.modules.catalog.application.schemas.request import ShowRequest
from app.modules.catalog.application.schemas.response import (
    AdminShowResponse,
    AdminShowSummaryResponse,
    GenreResponse,
    ShowCardResponse,
    SessionSummaryResponse,
    ShowDetailResponse,
)
from app.modules.catalog.application.mappers import card_response, session_response
from app.modules.catalog.application.usecases.utils import slugify, floor_from

from app.modules.catalog.infrastructure.queries import ShowSearchQuery
from app.modules.catalog.infrastructure.repositories import (
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

def _show_summary(show: Show) -> AdminShowSummaryResponse:
    return AdminShowSummaryResponse(
        id=show.id,
        title=show.title,
        synopsis=show.synopsis,
        image_url=show.image_url,
        genre=show.genre,
        status=show.status.value,
    )

def _show_response(show: Show, sessions: list[Session], counts_map: dict[UUID, SeatCounts], now: datetime) -> AdminShowResponse:
    return AdminShowResponse(
        **_show_summary(show).model_dump(),
        sessions=[
            session_response(s, counts_map.get(s.id, SeatCounts(0, 0)), now) for s in sessions
        ],
    )

def _session_summary(session: Session, counts: SeatCounts, now: datetime) -> SessionSummaryResponse:
    available = session.available_count(counts)

    return SessionSummaryResponse(
        id=session.id,
        starts_at=session.starts_at,
        venue=session.venue,
        capacity=session.capacity,
        available_count=available,
        status=session.status_at(now, counts),
    )

class ShowUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._show_repository = ShowRepository(session)
        self._session_repository = SessionRepository(session)
        self._show_search_query = ShowSearchQuery(session)

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
        sessions = await self._session_repository.find_all_by(show_id=show.id, order_by=["starts_at"])
        counts = {s.id: SeatCounts(0, 0) for s in sessions}

        if any(counts.get(s.id, SeatCounts(0, 0)).tickets_sold > 0 for s in sessions):
            raise ConflictError(
                "Cancele as sessões com ingressos vendidos antes de excluir o espetáculo."
            )

        show.deactivate()
        await self._show_repository.save(show)

    async def search(
        self, *, from_date: date | None, genre: str | None, pagination: PaginationParams, is_admin: bool
    ) -> Page[AdminShowSummaryResponse] | Page[ShowCardResponse]:
        if is_admin:
            shows, total = await self._show_repository.find_all_paginated(
                order_by=["-created_at"], page=pagination.page, size=pagination.size
            )
            return Page(
                items=[_show_summary(s) for s in shows],
                page=pagination.page,
                size=pagination.size,
                total=total,
            )

        floor = floor_from(from_date)
        genres: list[str] | None = None

        if genre is not None:
            genres = await self._resolve_genres(genre, floor)
            if not genres:
                return Page(items=[], page=pagination.page, size=pagination.size, total=0)

        rows, total = await self._show_search_query.search_with_upcoming(
            floor=floor, genres=genres, page=pagination.page, size=pagination.size
        )

        return Page(
            items=[card_response(row) for row in rows],
            page=pagination.page,
            size=pagination.size,
            total=total,
        )

    async def list_genres(self) -> list[GenreResponse]:
        labels = await self._show_search_query.list_genres_in_catalog(
            floor=datetime.now(timezone.utc)
        )

        by_slug: dict[str, str] = {}
        for label in labels:
            by_slug.setdefault(slugify(label), label)

        return [GenreResponse(slug=slug, label=label) for slug, label in by_slug.items()]

    async def get_show_detail(self, show_id: UUID, *, is_admin: bool) -> AdminShowResponse | ShowDetailResponse:
        show = await self._require_show(show_id)

        if is_admin:
            return await self._view_for(show)

        if not show.is_published:
            raise NotFoundError("Espetáculo não encontrado.")
        now = datetime.now(timezone.utc)

        sessions = [
            s
            for s in await self._session_repository.find_all_by(show_id=show.id, order_by=["starts_at"])
            if s.starts_at > now
        ]
        counts = {s.id: SeatCounts(0, 0) for s in sessions}

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
        labels = await self._show_search_query.list_genres_in_catalog(floor=floor)
        return [label for label in labels if slugify(label) == slug]

    async def _require_show(self, show_id: UUID) -> Show:
        show = await self._show_repository.find_by("id", show_id)
        if show is None:
            raise NotFoundError("Espetáculo não encontrado.")

        return show

    async def _view_for(self, show: Show) -> AdminShowResponse:
        sessions = await self._session_repository.find_all_by(show_id=show.id, order_by=["starts_at"])
        counts = {s.id: SeatCounts(0, 0) for s in sessions}

        return _show_response(show, sessions, counts, datetime.now(timezone.utc))

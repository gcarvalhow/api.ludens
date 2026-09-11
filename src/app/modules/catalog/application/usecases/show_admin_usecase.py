from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.domain.errors import ConflictError, NotFoundError
from app.modules.catalog.application.schemas.request import (
    CreateShowRequest,
    UpdateShowRequest,
)
from app.modules.catalog.application.schemas.response import AdminShowResponse
from app.modules.catalog.application.views import show_view
from app.modules.catalog.domain.aggregates.show import Show
from app.modules.catalog.infrastructure.repositories import (
    SeatCounts,
    SeatCountsRepository,
    SessionRepository,
    ShowRepository,
)


class ShowAdminUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._show_repo = ShowRepository(session)
        self._session_repo = SessionRepository(session)
        self._seat_counts_repo = SeatCountsRepository(session)

    async def list_shows(self) -> list[AdminShowResponse]:
        # Inclui rascunhos (find_all filtra só is_active, não status).
        shows = await self._show_repo.find_all(order_by=["-created_at"])
        sessions = await self._session_repo.find_all_for_shows([s.id for s in shows])
        counts = await self._seat_counts_repo.for_sessions([s.id for s in sessions])
        now = datetime.now(timezone.utc)
        grouped: dict[UUID, list[object]] = {}
        for sess in sessions:
            grouped.setdefault(sess.show_id, []).append(sess)
        return [show_view(show, grouped.get(show.id, []), counts, now) for show in shows]

    async def create_show(self, req: CreateShowRequest) -> AdminShowResponse:
        show = Show.create(
            title=req.title,
            synopsis=req.synopsis,
            image_url=req.image_url,
            genre=req.genre,
        )
        await self._show_repo.save(show)
        return show_view(show, [], {}, datetime.now(timezone.utc))

    async def update_show(self, show_id: UUID, req: UpdateShowRequest) -> AdminShowResponse:
        show = await self._require_show(show_id)
        data = req.model_dump(exclude_unset=True)
        show.update(
            title=data.get("title", show.title),
            synopsis=data.get("synopsis", show.synopsis),
            image_url=data.get("image_url", show.image_url),
            genre=data.get("genre", show.genre),
        )
        await self._show_repo.save(show)
        return await self._view_for(show)

    async def publish_show(self, show_id: UUID) -> None:
        show = await self._require_show(show_id)
        show.publish()
        await self._show_repo.save(show)

    async def unpublish_show(self, show_id: UUID) -> None:
        show = await self._require_show(show_id)
        show.unpublish()
        await self._show_repo.save(show)

    async def delete_show(self, show_id: UUID) -> None:
        show = await self._require_show(show_id)
        sessions = await self._session_repo.find_all_for_shows([show.id])
        counts = await self._seat_counts_repo.for_sessions([s.id for s in sessions])
        if any(counts.get(s.id, SeatCounts(0, 0)).tickets_sold > 0 for s in sessions):
            raise ConflictError(
                "Cancele as sessões com ingressos vendidos antes de excluir o espetáculo."
            )
        show.deactivate()
        await self._show_repo.save(show)

    async def _require_show(self, show_id: UUID) -> Show:
        show = await self._show_repo.find_by_id(show_id)
        if show is None:
            raise NotFoundError("Espetáculo não encontrado.")
        return show

    async def _view_for(self, show: Show) -> AdminShowResponse:
        sessions = await self._session_repo.find_all_for_shows([show.id])
        counts = await self._seat_counts_repo.for_sessions([s.id for s in sessions])
        return show_view(show, sessions, counts, datetime.now(timezone.utc))

from uuid import UUID

from app.core.domain.errors import NotFoundError

from app.modules.catalog.domain.aggregates import Show
from app.modules.catalog.domain.enumerations import ShowStatus
from app.modules.catalog.infrastructure.repositories import ShowRepository

async def require_published_show(show_repository: ShowRepository, show_id: UUID) -> Show:
    show = await show_repository.find_by("id", show_id)

    # An unpublished show drops out of the showcase and is also not navigable
    # via direct link — neither the show itself nor its sessions.
    if show is None or show.status is not ShowStatus.PUBLISHED:
        raise NotFoundError("Espetáculo não encontrado.")

    return show

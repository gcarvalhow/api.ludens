import pytest
from uuid import uuid4

from app.core.shared import PaginationParams
from app.core.domain.errors import NotFoundError
from app.modules.catalog.application.usecases.show_usecase import ShowUseCase
from app.modules.catalog.application.usecases.genre_usecase import GenreUseCase
from app.modules.catalog.application.schemas.request import GenreRequest, ShowRequest

pytestmark = pytest.mark.integration

async def _create_genre(session, name: str = "Comédia"):
    return await GenreUseCase(session).create_genre(GenreRequest(name=name))

async def test_create_show_requires_existing_genre(session):
    usecase = ShowUseCase(session)

    with pytest.raises(NotFoundError):
        await usecase.create_show(ShowRequest(title="Hamlet", synopsis="...", genre_id=uuid4()))

async def test_create_show_starts_as_draft(session):
    genre = await _create_genre(session)
    usecase = ShowUseCase(session)

    show = await usecase.create_show(ShowRequest(title="Hamlet", synopsis="Tragédia.", genre_id=genre.id))

    assert show.status == "draft"
    assert show.genre == genre.name
    assert show.sessions == []

async def test_update_show_changes_fields(session):
    genre = await _create_genre(session)
    other_genre = await _create_genre(session, name="Drama")
    usecase = ShowUseCase(session)
    show = await usecase.create_show(ShowRequest(title="Hamlet", synopsis="Tragédia.", genre_id=genre.id))

    updated = await usecase.update_show(
        show.id, ShowRequest(title="Hamlet (revival)", synopsis="Nova sinopse.", genre_id=other_genre.id)
    )

    assert updated.title == "Hamlet (revival)"
    assert updated.genre == other_genre.name

async def test_publish_then_unpublish_show(session):
    genre = await _create_genre(session)
    usecase = ShowUseCase(session)
    show = await usecase.create_show(ShowRequest(title="Hamlet", synopsis="...", genre_id=genre.id))

    await usecase.publish_show(show.id)
    published = await usecase.get_show_detail(show.id, is_admin=True)
    assert published.status == "published"

    await usecase.unpublish_show(show.id)
    unpublished = await usecase.get_show_detail(show.id, is_admin=True)
    assert unpublished.status == "draft"

async def test_get_show_detail_non_admin_hides_unpublished_show(session):
    genre = await _create_genre(session)
    usecase = ShowUseCase(session)
    show = await usecase.create_show(ShowRequest(title="Hamlet", synopsis="...", genre_id=genre.id))

    with pytest.raises(NotFoundError):
        await usecase.get_show_detail(show.id, is_admin=False)

async def test_delete_show_deactivates_it(session):
    genre = await _create_genre(session)
    usecase = ShowUseCase(session)
    show = await usecase.create_show(ShowRequest(title="Hamlet", synopsis="...", genre_id=genre.id))

    await usecase.delete_show(show.id)

    with pytest.raises(NotFoundError):
        await usecase.get_show_detail(show.id, is_admin=True)

async def test_search_as_admin_lists_all_shows_paginated(session):
    genre = await _create_genre(session)
    usecase = ShowUseCase(session)
    for title in ["Show A", "Show B", "Show C"]:
        await usecase.create_show(ShowRequest(title=title, synopsis="...", genre_id=genre.id))

    page = await usecase.search(
        from_date=None, genre_id=None, pagination=PaginationParams(page=1, size=2), is_admin=True
    )

    assert page.total == 3
    assert len(page.items) == 2

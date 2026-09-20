import pytest
from uuid import uuid4

from app.modules.catalog.domain.aggregates import Show
from app.core.domain.errors import ConflictError, NotFoundError
from app.modules.catalog.application.schemas.request import GenreRequest
from app.modules.catalog.application.usecases.genre_usecase import GenreUseCase
from app.modules.catalog.infrastructure.repositories import GenreRepository, ShowRepository

pytestmark = pytest.mark.integration

async def test_create_genre_succeeds(session):
    usecase = GenreUseCase(session)

    response = await usecase.create_genre(GenreRequest(name="Comédia"))
    assert response.name == "Comédia"

async def test_create_genre_with_duplicate_name_raises_conflict(session):
    usecase = GenreUseCase(session)
    await usecase.create_genre(GenreRequest(name="Drama"))

    with pytest.raises(ConflictError):
        await usecase.create_genre(GenreRequest(name="Drama"))

async def test_update_genre_not_found_raises(session):
    usecase = GenreUseCase(session)

    with pytest.raises(NotFoundError):
        await usecase.update_genre(uuid4(), GenreRequest(name="Qualquer"))

async def test_update_genre_to_an_already_used_name_raises_conflict(session):
    usecase = GenreUseCase(session)
    taken = await usecase.create_genre(GenreRequest(name="Terror"))
    mine = await usecase.create_genre(GenreRequest(name="Suspense"))

    with pytest.raises(ConflictError):
        await usecase.update_genre(mine.id, GenreRequest(name=taken.name))

async def test_update_genre_keeping_same_name_does_not_raise(session):
    usecase = GenreUseCase(session)
    genre = await usecase.create_genre(GenreRequest(name="Infantil"))

    updated = await usecase.update_genre(genre.id, GenreRequest(name="Infantil"))
    assert updated.name == "Infantil"

async def test_list_genres_orders_by_name(session):
    usecase = GenreUseCase(session)

    await usecase.create_genre(GenreRequest(name="Zebra"))
    await usecase.create_genre(GenreRequest(name="Alpha"))

    genres = await usecase.list_genres()
    assert [g.name for g in genres] == ["Alpha", "Zebra"]

async def test_deactivate_genre_succeeds_when_unused(session):
    usecase = GenreUseCase(session)
    genre = await usecase.create_genre(GenreRequest(name="Musical"))

    await usecase.deactivate_genre(genre.id)

    remaining = await GenreRepository(session).find_by("id", genre.id)
    assert remaining is None  # is_active=False -> no longer matches BaseRepository's filter

async def test_deactivate_genre_blocked_when_show_uses_it(session):
    usecase = GenreUseCase(session)
    genre = await usecase.create_genre(GenreRequest(name="Aventura"))

    show = Show.create(title="A Aventura", synopsis="...", image_url="/img/x.jpg", genre_id=genre.id)
    await ShowRepository(session).save(show)

    with pytest.raises(ConflictError):
        await usecase.deactivate_genre(genre.id)

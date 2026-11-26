from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.domain.errors import ConflictError, NotFoundError

from app.modules.catalog.domain.aggregates import Genre
from app.modules.catalog.application.schemas.request import GenreRequest
from app.modules.catalog.application.schemas.response import GenreResponse
from app.modules.catalog.application.mappers import genre_response
from app.modules.catalog.infrastructure.repositories import GenreRepository, ShowRepository

class GenreUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._genre_repository = GenreRepository(session)
        self._show_repository = ShowRepository(session)

    async def create_genre(self, req: GenreRequest) -> GenreResponse:
        if await self._genre_repository.exists_by("name", req.name):
            raise ConflictError("Já existe um gênero ativo com este nome.")

        genre = Genre.create(name=req.name)
        await self._genre_repository.save(genre)
        return genre_response(genre)

    async def update_genre(self, genre_id: UUID, req: GenreRequest) -> GenreResponse:
        genre = await self._require_genre(genre_id)

        if req.name != genre.name and await self._genre_repository.exists_by("name", req.name):
            raise ConflictError("Já existe um gênero ativo com este nome.")

        genre.update(name=req.name)
        await self._genre_repository.save(genre)
        return genre_response(genre)

    async def deactivate_genre(self, genre_id: UUID) -> None:
        genre = await self._require_genre(genre_id)

        if await self._show_repository.exists_by("genre_id", genre.id):
            raise ConflictError(
                "Existem espetáculos usando este gênero; altere-os para outro gênero antes de excluir."
            )

        genre.deactivate()
        await self._genre_repository.save(genre)

    async def list_genres(self) -> list[GenreResponse]:
        genres = await self._genre_repository.find_all(order_by=["name"])
        return [genre_response(g) for g in genres]

    async def _require_genre(self, genre_id: UUID) -> Genre:
        genre = await self._genre_repository.find_by("id", genre_id)
        if genre is None:
            raise NotFoundError("Gênero não encontrado.")

        return genre

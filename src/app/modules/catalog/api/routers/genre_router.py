from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.modules.identity.dependencies import require_admin

from app.modules.catalog.application.schemas.request import GenreRequest
from app.modules.catalog.application.schemas.response import GenreResponse
from app.modules.catalog.application.usecases.genre_usecase import GenreUseCase

router = APIRouter(prefix="/genres", tags=["03.Catalog - Genre"])

@router.post("", response_model=GenreResponse, status_code=201, dependencies=[Depends(require_admin)])
async def create(
    body: GenreRequest,
    session: AsyncSession = Depends(get_db)
) -> GenreResponse:
    return await GenreUseCase(session).create_genre(body)

@router.put("/{genre_id}", response_model=GenreResponse, dependencies=[Depends(require_admin)])
async def update(
    genre_id: UUID,
    body: GenreRequest,
    session: AsyncSession = Depends(get_db)
) -> GenreResponse:
    return await GenreUseCase(session).update_genre(genre_id, body)

@router.delete("/{genre_id}", status_code=204, dependencies=[Depends(require_admin)])
async def delete(
    genre_id: UUID,
    session: AsyncSession = Depends(get_db)
) -> Response:
    await GenreUseCase(session).deactivate_genre(genre_id)
    return Response(status_code=204)

@router.get("", response_model=list[GenreResponse])
async def list_genres(session: AsyncSession = Depends(get_db)) -> list[GenreResponse]:
    return await GenreUseCase(session).list_genres()

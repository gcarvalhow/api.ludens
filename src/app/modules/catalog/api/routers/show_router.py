from __future__ import annotations

from uuid import UUID
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.modules.catalog.application.schemas.response import (
    GenreResponse,
    PagedShowsResponse,
    ShowDetailResponse,
)
from app.modules.catalog.application.usecases.session_query_usecase import SessionQueryUseCase
from app.modules.catalog.application.usecases.show_search_usecase import ShowSearchUseCase

router = APIRouter(tags=["Catalog"])

@router.get("/shows", response_model=PagedShowsResponse)
async def search_shows(
    from_date: date | None = Query(default=None),
    genre: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=12, ge=1, le=48),
    session: AsyncSession = Depends(get_db),
) -> PagedShowsResponse:
    return await ShowSearchUseCase(session).search(
        from_date=from_date, genre=genre, page=page, size=size
    )

@router.get("/shows/{show_id}", response_model=ShowDetailResponse)
async def get_show(show_id: UUID, session: AsyncSession = Depends(get_db)) -> ShowDetailResponse:
    return await SessionQueryUseCase(session).get_show_detail(show_id)

@router.get("/genres", response_model=list[GenreResponse])
async def list_genres(session: AsyncSession = Depends(get_db)) -> list[GenreResponse]:
    return await ShowSearchUseCase(session).list_genres()

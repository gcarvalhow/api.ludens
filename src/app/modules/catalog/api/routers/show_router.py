from __future__ import annotations

from uuid import UUID
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.shared.pagination import Page, PaginationParams, make_pagination_params
from app.dependencies import get_db
from app.modules.catalog.application.schemas.response import (
    GenreResponse,
    ShowCardResponse,
    ShowDetailResponse,
)
from app.modules.catalog.application.usecases.show_usecase import ShowUseCase

router = APIRouter(tags=["Catalog"])

@router.get("/shows", response_model=Page[ShowCardResponse])
async def search_shows(
    from_date: date | None = Query(default=None),
    genre: str | None = Query(default=None),
    pagination: PaginationParams = Depends(make_pagination_params(default_size=12, max_size=48)),
    session: AsyncSession = Depends(get_db),
) -> Page[ShowCardResponse]:
    return await ShowUseCase(session).search(
        from_date=from_date, genre=genre, pagination=pagination
    )

@router.get("/shows/{show_id}", response_model=ShowDetailResponse)
async def get_show(show_id: UUID, session: AsyncSession = Depends(get_db)) -> ShowDetailResponse:
    return await ShowUseCase(session).get_show_detail(show_id)

@router.get("/genres", response_model=list[GenreResponse])
async def list_genres(session: AsyncSession = Depends(get_db)) -> list[GenreResponse]:
    return await ShowUseCase(session).list_genres()

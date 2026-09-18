from __future__ import annotations

from uuid import UUID
from datetime import date

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.core.shared import Page, PaginationParams, make_pagination_params

from app.modules.identity.dependencies import get_current_user_optional, require_admin
from app.modules.identity.domain.aggregates import User

from app.modules.catalog.application.schemas.request import ShowRequest
from app.modules.catalog.application.schemas.response import (
    AdminShowResponse,
    AdminShowSummaryResponse,
    ShowCardResponse,
    ShowDetailResponse,
)
from app.modules.catalog.application.usecases.show_usecase import ShowUseCase

router = APIRouter(tags=["01.Catalog - Show"])

@router.post("/shows/", response_model=AdminShowResponse, status_code=201, dependencies=[Depends(require_admin)])
async def create(
    body: ShowRequest, 
    session: AsyncSession = Depends(get_db)
) -> AdminShowResponse:
    return await ShowUseCase(session).create_show(body)

@router.put("/shows/{show_id}", response_model=AdminShowResponse, dependencies=[Depends(require_admin)])
async def update(
    show_id: UUID, 
    body: ShowRequest, 
    session: AsyncSession = Depends(get_db)
) -> AdminShowResponse:
    return await ShowUseCase(session).update_show(show_id, body)

@router.post("/shows/{show_id}/publish", status_code=204, dependencies=[Depends(require_admin)])
async def publish(
    show_id: UUID, 
    session: AsyncSession = Depends(get_db)
) -> Response:
    await ShowUseCase(session).publish_show(show_id)
    return Response(status_code=204)

@router.post("/shows/{show_id}/unpublish", status_code=204, dependencies=[Depends(require_admin)])
async def unpublish(
    show_id: UUID, 
    session: AsyncSession = Depends(get_db)
) -> Response:
    await ShowUseCase(session).unpublish_show(show_id)
    return Response(status_code=204)

@router.delete("/shows/{show_id}", status_code=204, dependencies=[Depends(require_admin)])
async def delete(
    show_id: UUID, 
    session: AsyncSession = Depends(get_db)
) -> Response:
    await ShowUseCase(session).delete_show(show_id)
    return Response(status_code=204)

@router.get("/shows/{show_id}", response_model=None)
async def get(
    show_id: UUID,
    current_user: User | None = Depends(get_current_user_optional),
    session: AsyncSession = Depends(get_db),
) -> AdminShowResponse | ShowDetailResponse:
    is_admin = current_user is not None and current_user.is_admin
    return await ShowUseCase(session).get_show_detail(show_id, is_admin=is_admin)
@router.get("/shows/", response_model=None)
async def search(
    from_date: date | None = Query(default=None),
    genre_id: UUID | None = Query(default=None),
    pagination: PaginationParams = Depends(make_pagination_params(default_size=12, max_size=48)),
    current_user: User | None = Depends(get_current_user_optional),
    session: AsyncSession = Depends(get_db),
) -> Page[AdminShowSummaryResponse] | Page[ShowCardResponse]:
    is_admin = current_user is not None and current_user.is_admin
    return await ShowUseCase(session).search(
        from_date=from_date, genre_id=genre_id, pagination=pagination, is_admin=is_admin
    )


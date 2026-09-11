from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.modules.catalog.application.schemas.request import ShowRequest, SessionRequest
from app.modules.catalog.application.schemas.response import (
    AdminSessionResponse,
    AdminShowResponse,
    AdminShowSummaryResponse,
)
from app.modules.catalog.application.usecases.session_usecase import SessionUseCase
from app.modules.catalog.application.usecases.show_usecase import ShowUseCase
from app.modules.identity.dependencies import require_admin

router = APIRouter(
    prefix="/admin",
    tags=["Catalog (admin)"],
    dependencies=[Depends(require_admin)],
)

@router.get("/shows", response_model=list[AdminShowSummaryResponse])
async def list_shows(session: AsyncSession = Depends(get_db)) -> list[AdminShowSummaryResponse]:
    return await ShowUseCase(session).list_shows()

@router.get("/shows/{show_id}", response_model=AdminShowResponse)
async def get_show(show_id: UUID, session: AsyncSession = Depends(get_db)) -> AdminShowResponse:
    return await ShowUseCase(session).get_show(show_id)

@router.post("/shows", response_model=AdminShowResponse, status_code=201)
async def create_show(
    body: ShowRequest, session: AsyncSession = Depends(get_db)
) -> AdminShowResponse:
    return await ShowUseCase(session).create_show(body)

@router.put("/shows/{show_id}", response_model=AdminShowResponse)
async def update_show(
    show_id: UUID, body: ShowRequest, session: AsyncSession = Depends(get_db)
) -> AdminShowResponse:
    return await ShowUseCase(session).update_show(show_id, body)

@router.post("/shows/{show_id}/publish", status_code=204)
async def publish_show(show_id: UUID, session: AsyncSession = Depends(get_db)) -> Response:
    await ShowUseCase(session).publish_show(show_id)
    return Response(status_code=204)

@router.post("/shows/{show_id}/unpublish", status_code=204)
async def unpublish_show(show_id: UUID, session: AsyncSession = Depends(get_db)) -> Response:
    await ShowUseCase(session).unpublish_show(show_id)
    return Response(status_code=204)

@router.delete("/shows/{show_id}", status_code=204)
async def delete_show(show_id: UUID, session: AsyncSession = Depends(get_db)) -> Response:
    await ShowUseCase(session).delete_show(show_id)
    return Response(status_code=204)

@router.post("/shows/{show_id}/sessions", response_model=AdminSessionResponse, status_code=201)
async def create_session(
    show_id: UUID, body: SessionRequest, session: AsyncSession = Depends(get_db)
) -> AdminSessionResponse:
    return await SessionUseCase(session).create_session(show_id, body)

@router.put("/sessions/{session_id}", response_model=AdminSessionResponse)
async def update_session(
    session_id: UUID, body: SessionRequest, session: AsyncSession = Depends(get_db)
) -> AdminSessionResponse:
    return await SessionUseCase(session).update_session(session_id, body)

@router.post("/sessions/{session_id}/cancel", status_code=202)
async def cancel_session(session_id: UUID, session: AsyncSession = Depends(get_db)) -> Response:
    await SessionUseCase(session).cancel_session(session_id)
    return Response(status_code=202)

@router.delete("/sessions/{session_id}", status_code=204)
async def delete_session(session_id: UUID, session: AsyncSession = Depends(get_db)) -> Response:
    await SessionUseCase(session).delete_session(session_id)
    return Response(status_code=204)

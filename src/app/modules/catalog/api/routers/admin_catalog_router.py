from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.modules.catalog.application.schemas.request import (
    CreateSessionRequest,
    CreateShowRequest,
    UpdateSessionRequest,
    UpdateShowRequest,
)
from app.modules.catalog.application.schemas.response import (
    AdminSessionResponse,
    AdminShowResponse,
)
from app.modules.catalog.application.usecases.session_admin_usecase import SessionAdminUseCase
from app.modules.catalog.application.usecases.show_admin_usecase import ShowAdminUseCase
from app.modules.identity.dependencies import require_admin

# require_admin em TODAS as rotas do router (403 se role != ADMIN).
router = APIRouter(
    prefix="/admin",
    tags=["Catalog (admin)"],
    dependencies=[Depends(require_admin)],
)


@router.get("/shows", response_model=list[AdminShowResponse])
async def list_shows(session: AsyncSession = Depends(get_db)) -> list[AdminShowResponse]:
    return await ShowAdminUseCase(session).list_shows()


@router.post("/shows", response_model=AdminShowResponse, status_code=201)
async def create_show(
    body: CreateShowRequest, session: AsyncSession = Depends(get_db)
) -> AdminShowResponse:
    return await ShowAdminUseCase(session).create_show(body)


@router.patch("/shows/{show_id}", response_model=AdminShowResponse)
async def update_show(
    show_id: UUID, body: UpdateShowRequest, session: AsyncSession = Depends(get_db)
) -> AdminShowResponse:
    return await ShowAdminUseCase(session).update_show(show_id, body)


@router.post("/shows/{show_id}/publish", status_code=204)
async def publish_show(show_id: UUID, session: AsyncSession = Depends(get_db)) -> Response:
    await ShowAdminUseCase(session).publish_show(show_id)
    return Response(status_code=204)


@router.post("/shows/{show_id}/unpublish", status_code=204)
async def unpublish_show(show_id: UUID, session: AsyncSession = Depends(get_db)) -> Response:
    await ShowAdminUseCase(session).unpublish_show(show_id)
    return Response(status_code=204)


@router.delete("/shows/{show_id}", status_code=204)
async def delete_show(show_id: UUID, session: AsyncSession = Depends(get_db)) -> Response:
    await ShowAdminUseCase(session).delete_show(show_id)
    return Response(status_code=204)


@router.post("/shows/{show_id}/sessions", response_model=AdminSessionResponse, status_code=201)
async def create_session(
    show_id: UUID, body: CreateSessionRequest, session: AsyncSession = Depends(get_db)
) -> AdminSessionResponse:
    return await SessionAdminUseCase(session).create_session(show_id, body)


@router.patch("/sessions/{session_id}", response_model=AdminSessionResponse)
async def update_session(
    session_id: UUID, body: UpdateSessionRequest, session: AsyncSession = Depends(get_db)
) -> AdminSessionResponse:
    return await SessionAdminUseCase(session).update_session(session_id, body)


@router.post("/sessions/{session_id}/cancel", status_code=202)
async def cancel_session(session_id: UUID, session: AsyncSession = Depends(get_db)) -> Response:
    await SessionAdminUseCase(session).cancel_session(session_id)
    return Response(status_code=202)


@router.delete("/sessions/{session_id}", status_code=204)
async def delete_session(session_id: UUID, session: AsyncSession = Depends(get_db)) -> Response:
    await SessionAdminUseCase(session).delete_session(session_id)
    return Response(status_code=204)

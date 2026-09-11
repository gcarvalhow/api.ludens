from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.modules.catalog.application.schemas.response import SessionDetailResponse
from app.modules.catalog.application.usecases.session_usecase import SessionUseCase

router = APIRouter(prefix="/sessions", tags=["Catalog"])

@router.get("/{session_id}", response_model=SessionDetailResponse)
async def get_session(
    session_id: UUID, session: AsyncSession = Depends(get_db)
) -> SessionDetailResponse:
    return await SessionUseCase(session).get_session_detail(session_id)

from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.domain import ForbiddenError

from app.dependencies import get_db
from app.modules.identity.dependencies import get_current_user

from app.modules.identity.domain.aggregates import User
from app.modules.identity.application.schemas.request import RegisterRequest
from app.modules.identity.application.schemas.response import TokenResponse, UserResponse

from app.modules.identity.api.routers.utils.cookies import set_refresh_cookie
from app.modules.identity.application.usecases.user_usecase import UserUseCase

router = APIRouter(prefix="/identity/users", tags=["02.Identity - User"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, response: Response, session: AsyncSession = Depends(get_db)) -> TokenResponse:
    token, raw_refresh = await UserUseCase(session).register(body)
    set_refresh_cookie(response, raw_refresh)

    return token

@router.get("/{user_id}", response_model=UserResponse)
async def get(user_id: UUID, session: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)) -> UserResponse:
    if not current_user.is_admin and current_user.id != user_id:
        raise ForbiddenError("Acesso restrito ao próprio usuário.")

    return await UserUseCase(session).get_by_id(user_id)

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, Request, Response, status

from app.dependencies import get_db

from app.modules.identity.dependencies import get_current_user

from app.modules.identity.domain.aggregates import User
from app.modules.identity.application.usecases.auth_usecase import AuthUseCase

from app.modules.identity.application.schemas.request import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    ResetPasswordRequest,
)

from app.modules.identity.application.schemas.response import TokenResponse
from app.modules.identity.shared import REFRESH_COOKIE, REFRESH_PATH, set_refresh_cookie

router = APIRouter(prefix="/identity/authentication", tags=["01.Identity - Auth"])

@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest, 
    response: Response, 
    session: AsyncSession = Depends(get_db)
) -> TokenResponse:
    token, raw_refresh = await AuthUseCase(session).login(body)
    set_refresh_cookie(response, raw_refresh)

    return token

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    response: Response, 
    session: AsyncSession = Depends(get_db), 
    user: User = Depends(get_current_user)
) -> None:
    await AuthUseCase(session).logout(user)
    response.delete_cookie(REFRESH_COOKIE, path=REFRESH_PATH)

@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    request: Request, 
    response: Response, 
    session: AsyncSession = Depends(get_db)
) -> TokenResponse:
    token, raw_refresh = await AuthUseCase(session).refresh(request.cookies.get(REFRESH_COOKIE))
    set_refresh_cookie(response, raw_refresh)

    return token

@router.post("/password/change", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    body: ChangePasswordRequest, 
    session: AsyncSession = Depends(get_db), 
    user: User = Depends(get_current_user)
) -> None:
    await AuthUseCase(session).change_password(user, body)

@router.post("/password/forgot", response_model=dict[str, str], status_code=status.HTTP_202_ACCEPTED)
async def forgot_password(
    body: ForgotPasswordRequest, 
    session: AsyncSession = Depends(get_db)
) -> dict[str, str]:
    return await AuthUseCase(session).forgot_password(body)

@router.post("/password/reset", status_code=status.HTTP_204_NO_CONTENT)
async def reset_password(
    body: ResetPasswordRequest, 
    session: AsyncSession = Depends(get_db)
) -> None:
    await AuthUseCase(session).reset_password(body)

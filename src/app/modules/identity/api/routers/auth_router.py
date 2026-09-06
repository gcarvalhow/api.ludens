from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.dependencies import get_db
from app.modules.identity.application.schemas.request import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
)
from app.modules.identity.application.schemas.response import (
    BuyerResponse,
    MessageResponse,
    TokenResponse,
)
from app.modules.identity.application.usecases.auth_usecase import AuthUseCase
from app.modules.identity.dependencies import get_current_buyer
from app.modules.identity.domain.aggregates.buyer import Buyer

router = APIRouter(prefix="/auth", tags=["Identity"])

_REFRESH_COOKIE = "refresh_token"
_REFRESH_PATH = "/auth"


def _set_refresh_cookie(response: Response, raw_refresh: str) -> None:
    # HttpOnly (bloqueia JS/XSS), SameSite=Strict (CSRF), Path restrito a /auth.
    # Secure e' desligado so' em desenvolvimento (dev local sem TLS).
    response.set_cookie(
        key=_REFRESH_COOKIE,
        value=raw_refresh,
        httponly=True,
        secure=settings.environment != "development",
        samesite="strict",
        path=_REFRESH_PATH,
        max_age=settings.refresh_token_expire_days * 24 * 3600,
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest, response: Response, session: AsyncSession = Depends(get_db)
) -> TokenResponse:
    token, raw_refresh = await AuthUseCase(session).register(body)
    _set_refresh_cookie(response, raw_refresh)
    return token


@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest, response: Response, session: AsyncSession = Depends(get_db)
) -> TokenResponse:
    token, raw_refresh = await AuthUseCase(session).login(body)
    _set_refresh_cookie(response, raw_refresh)
    return token


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    request: Request, response: Response, session: AsyncSession = Depends(get_db)
) -> TokenResponse:
    token, raw_refresh = await AuthUseCase(session).refresh(request.cookies.get(_REFRESH_COOKIE))
    _set_refresh_cookie(response, raw_refresh)
    return token


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    response: Response,
    session: AsyncSession = Depends(get_db),
    buyer: Buyer = Depends(get_current_buyer),
) -> None:
    await AuthUseCase(session).logout(buyer)
    response.delete_cookie(_REFRESH_COOKIE, path=_REFRESH_PATH)


@router.post("/password/change", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    body: ChangePasswordRequest,
    session: AsyncSession = Depends(get_db),
    buyer: Buyer = Depends(get_current_buyer),
) -> None:
    await AuthUseCase(session).change_password(buyer, body)


@router.post(
    "/password/forgot", response_model=MessageResponse, status_code=status.HTTP_202_ACCEPTED
)
async def forgot_password(
    body: ForgotPasswordRequest, session: AsyncSession = Depends(get_db)
) -> MessageResponse:
    return await AuthUseCase(session).forgot_password(body)


@router.post("/password/reset", status_code=status.HTTP_204_NO_CONTENT)
async def reset_password(
    body: ResetPasswordRequest, session: AsyncSession = Depends(get_db)
) -> None:
    await AuthUseCase(session).reset_password(body)


@router.get("/me", response_model=BuyerResponse)
async def me(
    session: AsyncSession = Depends(get_db),
    buyer: Buyer = Depends(get_current_buyer),
) -> BuyerResponse:
    return await AuthUseCase(session).me(buyer)

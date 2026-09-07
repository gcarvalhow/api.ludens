from fastapi import Response

from app.config import settings

REFRESH_COOKIE = "refresh_token"
REFRESH_PATH = "/auth"

def set_refresh_cookie(response: Response, raw_refresh: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=raw_refresh,
        httponly=True,
        secure=settings.environment != "development",
        samesite="strict",
        path=REFRESH_PATH,
        max_age=settings.refresh_token_expire_days * 24 * 3600,
    )

import jwt
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from app.config import settings
from app.core.domain import AuthError
from app.modules.identity.domain.aggregates import User

_ALGORITHM = "HS256"

class TokenService:
    def issue_access(self, user: User) -> tuple[str, int]:
        expires_in = settings.access_token_expire_minutes * 60
        now = datetime.now(timezone.utc)

        payload = {
            "sub": str(user.id),
            "is_admin": user.is_admin,
            "security_stamp": str(user.security_stamp),
            "type": "access",
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(seconds=expires_in)).timestamp()),
        }

        return jwt.encode(payload, settings.jwt_secret_key, algorithm=_ALGORITHM), expires_in

    def decode_access(self, token: str) -> dict:
        try:
            payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[_ALGORITHM])
        except jwt.PyJWTError as exc:
            raise AuthError("Sessão inválida ou expirada.") from exc

        if payload.get("type") != "access":
            raise AuthError("Sessão inválida ou expirada.")

        return payload

    def new_opaque_token(self) -> str:
        return secrets.token_urlsafe(32)

    def hash_opaque(self, token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

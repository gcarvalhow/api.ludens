import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import jwt

from app.config import settings
from app.core.domain.errors import AuthError
from app.modules.identity.domain.aggregates.buyer import Buyer

_ALGORITHM = "HS256"


class TokenService:
    # Dual-token (ver docs.ludens/backend/security/authentication.md):
    # - access token JWT HS256 curto, com claim security_stamp;
    # - refresh token opaco — a API guarda so' o hash SHA-256 e nunca o token.

    def issue_access(self, buyer: Buyer) -> tuple[str, int]:
        expires_in = settings.access_token_expire_minutes * 60
        now = datetime.now(timezone.utc)
        payload = {
            "sub": str(buyer.id),
            "role": buyer.role.value,
            "security_stamp": str(buyer.security_stamp),
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
        # Um refresh token usado no lugar do access e' rejeitado pelo claim `type`.
        if payload.get("type") != "access":
            raise AuthError("Sessão inválida ou expirada.")
        return payload

    def new_opaque_token(self) -> str:
        return secrets.token_urlsafe(32)

    def hash_opaque(self, token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

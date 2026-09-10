from datetime import datetime, timedelta, timezone
from uuid import uuid4

import pytest

from app.core.domain import GoneError
from app.modules.identity.domain.entities import PasswordResetToken


def _issue(ttl_minutes: int = 60) -> PasswordResetToken:
    now = datetime.now(timezone.utc)
    return PasswordResetToken.issue(
        user_id=uuid4(), token_hash="hash", expires_at=now + timedelta(minutes=ttl_minutes)
    )


def test_issue_cria_token_nao_consumido():
    token = _issue()

    assert token.used_at is None
    assert token.id is not None


def test_consume_valido_marca_used_at_uma_vez():
    token = _issue()
    now = datetime.now(timezone.utc)

    token.consume(now)

    assert token.used_at == now


def test_consume_segunda_vez_falha():
    token = _issue()
    now = datetime.now(timezone.utc)
    token.consume(now)

    with pytest.raises(GoneError):
        token.consume(now + timedelta(seconds=1))


def test_consume_token_expirado_falha():
    token = _issue(ttl_minutes=-1)

    with pytest.raises(GoneError):
        token.consume(datetime.now(timezone.utc))


def test_invalidate_impede_consumo_posterior():
    token = _issue()
    now = datetime.now(timezone.utc)

    token.invalidate(now)

    with pytest.raises(GoneError):
        token.consume(now + timedelta(seconds=1))

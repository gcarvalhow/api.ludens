from datetime import datetime, timedelta, timezone
from uuid import uuid4

import pytest

from app.core.domain import DomainError, UnauthorizedError
from app.modules.identity.domain.entities import RefreshToken


def _issue() -> RefreshToken:
    now = datetime.now(timezone.utc)
    return RefreshToken.issue(uuid4(), "hash", now + timedelta(days=7))


def test_issue_cria_token_nao_usado():
    token = _issue()

    assert token.used is False
    assert token.id is not None


def test_rotate_marca_used():
    token = _issue()
    now = datetime.now(timezone.utc)

    token.rotate(now)

    assert token.used is True
    assert token.rotated_at == now


def test_rotate_de_token_ja_rotacionado_e_reuso_detectado():
    token = _issue()
    now = datetime.now(timezone.utc)
    token.rotate(now)

    with pytest.raises(UnauthorizedError):
        token.rotate(now + timedelta(seconds=1))

    assert issubclass(UnauthorizedError, DomainError)

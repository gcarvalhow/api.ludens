from datetime import datetime, timedelta, timezone

from app.modules.identity.domain.aggregates import User
from app.modules.identity.domain.enumerations import Role
from app.modules.identity.domain.events import PasswordResetRequested, UserRegistered
from app.modules.identity.domain.value_objects import CPF, Email


VALID_CPF = "52998224725"


def _register() -> User:
    return User.register("Ana Souza", CPF(VALID_CPF), Email("ana@example.com"), "hash-1")


def test_registra_user_com_cpf_valido_emite_evento_e_papel_buyer():
    user = _register()

    events = user.dequeue_events()
    assert [type(event).__name__ for event in events] == ["UserRegistered"]

    registered = events[0]
    assert isinstance(registered, UserRegistered)
    assert registered.cpf == VALID_CPF
    assert registered.role == Role.BUYER.value

    assert user.role is Role.BUYER
    assert user.cpf == VALID_CPF
    assert user.email == "ana@example.com"
    assert user.password_hash == "hash-1"
    assert user.id is not None
    assert user.security_stamp is not None


def test_change_password_rotaciona_security_stamp():
    user = _register()
    original_stamp = user.security_stamp
    user.dequeue_events()

    user.change_password("hash-2")

    assert [type(event).__name__ for event in user.dequeue_events()] == [
        "UserPasswordChanged",
        "UserSecurityStampRotated",
    ]
    assert user.password_hash == "hash-2"
    assert user.security_stamp != original_stamp


def test_reset_password_tambem_rotaciona_security_stamp():
    user = _register()
    original_stamp = user.security_stamp
    user.dequeue_events()

    user.reset_password("hash-3")

    assert [type(event).__name__ for event in user.dequeue_events()] == [
        "UserPasswordChanged",
        "UserSecurityStampRotated",
    ]
    assert user.password_hash == "hash-3"
    assert user.security_stamp != original_stamp


def test_request_password_reset_emite_evento_com_token_em_claro():
    user = _register()
    user.dequeue_events()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)

    user.request_password_reset("raw-token", expires_at)

    events = user.dequeue_events()
    assert [type(event).__name__ for event in events] == ["PasswordResetRequested"]

    event = events[0]
    assert isinstance(event, PasswordResetRequested)
    assert event.token == "raw-token"
    assert event.email == user.email
    assert event.id == user.id

from datetime import datetime, timedelta, timezone

from app.modules.identity.domain.aggregates import User
from app.modules.identity.domain.value_objects import CPF, Email

from app.modules.identity.domain.events import (
    AccountDeletionRequested,
    EmailChangeRequested,
    EmailChanged,
    PasswordResetRequested,
    UserDeactivated,
    UserPasswordChanged,
    UserProfileUpdated,
    UserRegistered,
    UserSecurityStampRotated,
)

_CPF = CPF("52998224725")
_EMAIL = Email("test@ludens.app")

def _register() -> User:
    return User.register(
        name="Fulano de Tal", cpf=_CPF, email=_EMAIL, password_hash="hashed", is_admin=False
    )

def test_register_sets_properties():
    user = _register()

    assert user.name == "Fulano de Tal"
    assert user.cpf == "52998224725"
    assert user.email == "test@ludens.app"
    assert user.password_hash == "hashed"
    assert user.is_admin is False
    assert user.security_stamp is not None

def test_register_raises_user_registered_event_with_version_one():
    user = _register()
    events = user.dequeue_events()

    assert len(events) == 1
    assert isinstance(events[0], UserRegistered)
    assert events[0].version == 1
    assert user.version == 1

def test_change_password_raises_password_changed_and_rotates_stamp():
    user = _register()
    user.dequeue_events()
    old_stamp = user.security_stamp

    user.change_password("new-hash")
    events = user.dequeue_events()

    assert user.password_hash == "new-hash"
    assert any(isinstance(e, UserPasswordChanged) for e in events)
    assert any(isinstance(e, UserSecurityStampRotated) for e in events)
    assert user.security_stamp != old_stamp

def test_reset_password_behaves_like_change_password():
    user = _register()
    user.dequeue_events()

    user.reset_password("reset-hash")

    assert user.password_hash == "reset-hash"

    events = user.dequeue_events()
    assert any(isinstance(e, UserPasswordChanged) for e in events)

def test_update_profile_changes_name_and_raises_event():
    user = _register()
    user.dequeue_events()

    user.update_profile("Novo Nome")
    assert user.name == "Novo Nome"

    events = user.dequeue_events()

    assert len(events) == 1
    assert isinstance(events[0], UserProfileUpdated)
    assert events[0].name == "Novo Nome"

def test_request_password_reset_raises_event_without_changing_state():
    user = _register()
    user.dequeue_events()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)

    user.request_password_reset("raw-token", expires_at)

    events = user.dequeue_events()
    assert len(events) == 1

    event = events[0]

    assert isinstance(event, PasswordResetRequested)
    assert event.email == user.email
    assert event.token == "raw-token"
    assert event.expires_at == expires_at
    assert user.password_hash == "hashed"

def test_request_email_change_does_not_apply_new_email_yet():
    user = _register()
    user.dequeue_events()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)

    user.request_email_change("novo@ludens.app", "raw-token", expires_at)

    events = user.dequeue_events()
    assert len(events) == 1

    event = events[0]

    assert isinstance(event, EmailChangeRequested)
    assert event.old_email == "test@ludens.app"
    assert event.new_email == "novo@ludens.app"
    assert user.email == "test@ludens.app"

def test_apply_email_change_updates_email_and_rotates_stamp():
    user = _register()
    user.dequeue_events()
    old_stamp = user.security_stamp

    user.apply_email_change("novo@ludens.app")
    assert user.email == "novo@ludens.app"

    events = user.dequeue_events()

    assert any(isinstance(e, EmailChanged) for e in events)
    assert any(isinstance(e, UserSecurityStampRotated) for e in events)

    assert user.security_stamp != old_stamp

def test_request_account_deletion_raises_event():
    user = _register()
    user.dequeue_events()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)

    user.request_account_deletion("raw-token", expires_at)

    events = user.dequeue_events()
    assert len(events) == 1

    event = events[0]

    assert isinstance(event, AccountDeletionRequested)
    assert event.token == "raw-token"
    assert event.expires_at == expires_at

def test_deactivate_sets_is_active_false_and_rotates_stamp():
    user = _register()
    user.dequeue_events()
    old_stamp = user.security_stamp

    user.deactivate()
    assert user.is_active is False
    
    events = user.dequeue_events()

    assert any(isinstance(e, UserDeactivated) for e in events)
    assert any(isinstance(e, UserSecurityStampRotated) for e in events)
    assert user.security_stamp != old_stamp

import pytest
from sqlalchemy import select

from app.outbox.models import Event
from app.core.shared import PaginationParams
from app.core.domain import ConflictError, GoneError

from app.modules.identity.application.schemas.request import (
    RegisterRequest,
    RequestEmailChangeRequest,
    UpdateProfileRequest,
)

from app.modules.identity.application.usecases.user_usecase import UserUseCase
from app.modules.identity.domain.aggregates import User
from app.modules.identity.domain.value_objects import CPF, Email
from app.modules.identity.infrastructure.repositories import UserRepository

pytestmark = pytest.mark.integration

_CPFS = ["52998224725", "11144477735", "39053344705"]

def _register_request(*, cpf: str = _CPFS[0], email: str = "user@ludens.app", name: str = "Fulano de Tal") -> RegisterRequest:
    return RegisterRequest(name=name, cpf=cpf, email=email, password="senha12345")

async def _create_admin(session, *, cpf: str, email: str, name: str = "Admin") -> User:
    admin = User.register(
        name=name, cpf=CPF(cpf), email=Email(email), password_hash="hashed", is_admin=True
    )
    await UserRepository(session).save(admin)
    return admin

async def _last_event_token(session, event_type: str) -> str:
    result = await session.execute(
        select(Event).where(Event.event_type == event_type).order_by(Event.created_at.desc())
    )

    event = result.scalars().first()

    assert event is not None, f"nenhum evento {event_type} encontrado no outbox"
    return event.payload["token"]

async def test_register_creates_user_and_issues_session(session):
    usecase = UserUseCase(session)

    token, refresh_token = await usecase.register(_register_request())

    assert token.access_token
    assert token.expires_in > 0
    assert refresh_token

    user_repository = UserRepository(session)
    created = await user_repository.find_by("email", "user@ludens.app")

    assert created is not None
    assert created.cpf == _CPFS[0]

async def test_register_with_existing_cpf_raises_conflict(session):
    usecase = UserUseCase(session)
    await usecase.register(_register_request(cpf=_CPFS[0], email="first@ludens.app"))

    with pytest.raises(ConflictError):
        await usecase.register(_register_request(cpf=_CPFS[0], email="second@ludens.app"))

async def test_register_with_existing_email_raises_conflict(session):
    usecase = UserUseCase(session)
    await usecase.register(_register_request(cpf=_CPFS[0], email="dup@ludens.app"))

    with pytest.raises(ConflictError):
        await usecase.register(_register_request(cpf=_CPFS[1], email="dup@ludens.app"))

async def test_list_users_returns_empty_page_when_no_users(session):
    usecase = UserUseCase(session)

    page = await usecase.list_users(PaginationParams(page=1, size=10))

    assert page.items == []
    assert page.total == 0

async def test_list_users_paginates_across_pages(session):
    usecase = UserUseCase(session)

    for i, cpf in enumerate(_CPFS):
        await usecase.register(_register_request(cpf=cpf, email=f"user{i}@ludens.app"))

    first_page = await usecase.list_users(PaginationParams(page=1, size=2))
    second_page = await usecase.list_users(PaginationParams(page=2, size=2))

    assert len(first_page.items) == 2
    assert first_page.total == 3
    assert len(second_page.items) == 1
    assert second_page.total == 3

    first_ids = {u.id for u in first_page.items}
    second_ids = {u.id for u in second_page.items}

    assert first_ids.isdisjoint(second_ids)

async def test_update_profile_changes_name(session):
    usecase = UserUseCase(session)
    await usecase.register(_register_request())

    user = await UserRepository(session).find_by("email", "user@ludens.app")
    updated = await usecase.update_profile(user, UpdateProfileRequest(name="Novo Nome"))

    assert updated.name == "Novo Nome"

async def test_request_email_change_with_email_already_in_use_raises_conflict(session):
    usecase = UserUseCase(session)

    await usecase.register(_register_request(cpf=_CPFS[0], email="taken@ludens.app"))
    await usecase.register(_register_request(cpf=_CPFS[1], email="requester@ludens.app"))

    requester = await UserRepository(session).find_by("email", "requester@ludens.app")

    with pytest.raises(ConflictError):
        await usecase.request_email_change(requester, RequestEmailChangeRequest(new_email="taken@ludens.app"))

async def test_email_change_full_flow_confirms_new_email(session):
    usecase = UserUseCase(session)
    await usecase.register(_register_request(email="old@ludens.app"))

    user = await UserRepository(session).find_by("email", "old@ludens.app")

    await usecase.request_email_change(user, RequestEmailChangeRequest(new_email="new@ludens.app"))
    raw_token = await _last_event_token(session, "EmailChangeRequested")

    await usecase.confirm_email_change(raw_token)
    confirmed = await UserRepository(session).find_by("email", "new@ludens.app")

    assert confirmed is not None
    assert confirmed.id == user.id

async def test_confirm_email_change_with_invalid_token_raises_gone(session):
    usecase = UserUseCase(session)

    with pytest.raises(GoneError):
        await usecase.confirm_email_change("token-que-nao-existe")

async def test_account_deletion_full_flow_deactivates_user(session):
    usecase = UserUseCase(session)

    admin1 = await _create_admin(session, cpf=_CPFS[0], email="admin1@ludens.app")
    await _create_admin(session, cpf=_CPFS[1], email="admin2@ludens.app")

    await usecase.request_account_deletion(admin1)
    raw_token = await _last_event_token(session, "AccountDeletionRequested")

    await usecase.confirm_account_deletion(raw_token)
    assert admin1.is_active is False

async def test_request_account_deletion_as_last_admin_raises_conflict(session):
    usecase = UserUseCase(session)
    only_admin = await _create_admin(session, cpf=_CPFS[0], email="onlyadmin@ludens.app")

    with pytest.raises(ConflictError):
        await usecase.request_account_deletion(only_admin)

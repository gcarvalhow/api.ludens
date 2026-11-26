from uuid import uuid4
from datetime import datetime, timedelta, timezone

import pytest

from app.core.domain import ConflictError

from app.modules.identity.domain.aggregates import User
from app.modules.identity.domain.value_objects import CPF, Email
from app.modules.identity.infrastructure.repositories import UserRepository

from app.modules.catalog.domain.aggregates import Genre, Session, Show
from app.modules.catalog.application.usecases.show_usecase import ShowUseCase
from app.modules.catalog.application.usecases.session_usecase import SessionUseCase
from app.modules.catalog.infrastructure.repositories import GenreRepository, SessionRepository, ShowRepository

from app.modules.booking.application.schemas import ReservationRequest
from app.modules.booking.application.purchase_usecase import PurchaseUseCase
from app.modules.booking.application.reservation_usecase import ReservationUseCase

pytestmark = pytest.mark.integration

# N3: in N1 these guards read SeatCounts(0, 0) as a placeholder, so they could
# never fire. Booking (N2) made the counts real; these tests pin the new behavior.

async def _seed(db, *, capacity=10):
    genre = Genre.create(name=f"N3 {uuid4().hex[:12]}")
    await GenreRepository(db).save(genre)
    await db.flush()

    show = Show.create(title="Regressão N3", synopsis="...", image_url="/n3.jpg", genre_id=genre.id)
    show.publish()
    await ShowRepository(db).save(show)
    await db.flush()

    session = Session.create(
        show_id=show.id,
        starts_at=datetime.now(timezone.utc) + timedelta(days=5),
        venue="Teatro",
        capacity=capacity,
        full_price_cents=4000,
    )
    await SessionRepository(db).save(session)

    buyer = User.register("Comprador N3", CPF("52998224725"), Email(f"{uuid4().hex}@example.com"), "hash")
    await UserRepository(db).save(buyer)
    await db.flush()

    return show, session, buyer

async def _reserve(db, session, buyer, *, full=1, half=0):
    request = ReservationRequest(session_id=session.id, full_quantity=full, half_quantity=half, idempotency_key=uuid4())

    return await ReservationUseCase(db).create(request, user_id=buyer.id, cpf=buyer.cpf)

async def _buy(db, session, buyer, *, full=1, half=0):
    reservation = await _reserve(db, session, buyer, full=full, half=half)
    order = await PurchaseUseCase(db).start(reservation.id, buyer)

    return await PurchaseUseCase(db).simulate(order.id, "approved", buyer)

async def test_admin_session_view_reports_sold_and_reserved_tickets(session):
    _, event, buyer = await _seed(session)
    await _buy(session, event, buyer, full=2)
    await _reserve(session, event, buyer, full=0, half=1)

    detail = await SessionUseCase(session).get_session_detail(event.id, is_admin=True)

    assert detail.tickets_sold == 2
    assert detail.reserved_open == 1
    assert detail.can_delete is False

async def test_public_session_view_subtracts_sold_and_reserved_from_capacity(session):
    _, event, buyer = await _seed(session, capacity=5)
    await _buy(session, event, buyer, full=2)
    await _reserve(session, event, buyer, full=1)

    detail = await SessionUseCase(session).get_session_detail(event.id, is_admin=False)

    assert detail.available_count == 2
    assert detail.status == "on_sale"

async def test_delete_session_with_paid_ticket_is_blocked(session):
    _, event, buyer = await _seed(session)
    paid = await _buy(session, event, buyer)

    with pytest.raises(ConflictError):
        await SessionUseCase(session).delete_session(event.id)

    assert (await PurchaseUseCase(session).get(paid.id, buyer)).status == "paid"

async def test_delete_session_with_only_open_hold_cancels_the_hold(session):
    _, event, buyer = await _seed(session)
    reservation = await _reserve(session, event, buyer, full=2)

    await SessionUseCase(session).delete_session(event.id)

    assert (await ReservationUseCase(session).get(reservation.id, buyer.id)).status == "cancelled"

async def test_delete_show_with_paid_ticket_is_blocked(session):
    show, event, buyer = await _seed(session)
    await _buy(session, event, buyer)

    with pytest.raises(ConflictError):
        await ShowUseCase(session).delete_show(show.id)

from uuid import uuid4
from datetime import datetime, timedelta, timezone

from app.modules.catalog.domain.enumerations import SessionStatus
from app.modules.catalog.domain.aggregates import SeatCounts, Session

from app.modules.catalog.domain.events import (
    SessionCancelled,
    SessionCreated,
    SessionDeactivated,
    SessionUpdated,
)

_SHOW_ID = uuid4()

def _create(*, capacity: int = 100, full_price_cents: int = 5000, starts_at: datetime | None = None) -> Session:
    return Session.create(
        show_id=_SHOW_ID,
        starts_at=starts_at or datetime.now(timezone.utc) + timedelta(days=1),
        venue="Teatro Municipal",
        capacity=capacity,
        full_price_cents=full_price_cents,
    )

def test_create_sets_on_sale_status_and_active():
    session = _create()

    assert session.status is SessionStatus.ON_SALE
    assert session.is_active is True

    events = session.dequeue_events()
    assert len(events) == 1
    assert isinstance(events[0], SessionCreated)

def test_update_changes_fields_and_raises_event():
    session = _create()
    session.dequeue_events()
    new_starts_at = datetime.now(timezone.utc) + timedelta(days=2)

    session.update(starts_at=new_starts_at, venue="Novo Teatro", capacity=50, full_price_cents=6000)

    assert session.venue == "Novo Teatro"
    assert session.capacity == 50
    assert session.full_price_cents == 6000
    
    events = session.dequeue_events()
    assert isinstance(events[0], SessionUpdated)

def test_cancel_sets_cancelled_status_and_raises_event():
    session = _create()
    session.dequeue_events()

    session.cancel()
    assert session.status is SessionStatus.CANCELLED

    events = session.dequeue_events()
    assert len(events) == 1
    assert isinstance(events[0], SessionCancelled)

def test_deactivate_raises_event():
    session = _create()
    session.dequeue_events()

    session.deactivate()

    assert session.is_active is False

    events = session.dequeue_events()
    assert isinstance(events[0], SessionDeactivated)

def test_half_price_is_fifty_percent_truncated_to_the_cent():
    # RN04 — half-price ticket requires no student document, only the price differs.
    session = _create(full_price_cents=4999)

    assert session.half_price_cents == 2499

def test_available_count_subtracts_sold_and_reserved_from_capacity():
    session = _create(capacity=100)

    assert session.available_count(SeatCounts(tickets_sold=30, reserved_open=10)) == 60

def test_available_count_never_goes_negative():
    session = _create(capacity=10)

    assert session.available_count(SeatCounts(tickets_sold=8, reserved_open=5)) == 0

def test_status_at_returns_cancelled_when_session_is_cancelled():
    session = _create()
    session.cancel()
    now = datetime.now(timezone.utc)

    assert session.status_at(now, SeatCounts(0, 0)) == "cancelled"

def test_status_at_returns_closed_when_start_time_has_passed():
    past = datetime.now(timezone.utc) - timedelta(hours=1)
    session = _create(starts_at=past)
    now = datetime.now(timezone.utc)

    assert session.status_at(now, SeatCounts(0, 0)) == "closed"

def test_status_at_returns_sold_out_when_no_seats_available():
    session = _create(capacity=10)
    now = datetime.now(timezone.utc)

    assert session.status_at(now, SeatCounts(tickets_sold=10, reserved_open=0)) == "sold_out"

def test_status_at_returns_on_sale_otherwise():
    session = _create(capacity=10)
    now = datetime.now(timezone.utc)

    assert session.status_at(now, SeatCounts(tickets_sold=1, reserved_open=0)) == "on_sale"

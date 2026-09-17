from datetime import datetime

from app.modules.catalog.domain.aggregates import Session
from app.modules.catalog.domain.enumerations import SessionStatus
from app.modules.catalog.application.schemas.response import AdminSessionResponse
from app.modules.catalog.application.usecases.utils.session_availability import SeatCounts
from app.modules.catalog.application.usecases.utils.money import reais_from_cents

def session_response(session: Session, counts: SeatCounts, now: datetime) -> AdminSessionResponse:
    if session.status is SessionStatus.CANCELLED:
        status = "cancelled"
    elif session.starts_at <= now:
        status = "closed"
    else:
        status = "on_sale"

    return AdminSessionResponse(
        id=session.id,
        show_id=session.show_id,
        starts_at=session.starts_at,
        venue=session.venue,
        capacity=session.capacity,
        full_price=reais_from_cents(session.full_price_cents),
        half_price=reais_from_cents(session.half_price_cents),
        status=status,
        tickets_sold=counts.tickets_sold,
        reserved_open=counts.reserved_open,
        can_delete=counts.tickets_sold == 0,
    )

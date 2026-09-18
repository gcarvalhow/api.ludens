from datetime import datetime

from app.modules.catalog.domain.aggregates import SeatCounts, Session
from app.modules.catalog.application.schemas.response import AdminSessionResponse
from app.modules.catalog.application.utils import reais_from_cents

def session_response(session: Session, counts: SeatCounts, now: datetime) -> AdminSessionResponse:
    public_status = session.status_at(now, counts)
    status = "on_sale" if public_status == "sold_out" else public_status

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

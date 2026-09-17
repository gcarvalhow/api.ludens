from datetime import datetime

from app.modules.catalog.domain.aggregates import Session
from app.modules.catalog.domain.enumerations import SessionStatus
from app.modules.catalog.infrastructure.repositories import SeatCounts

def available_count(session: Session, counts: SeatCounts) -> int:
    # Available = capacity - confirmed - open, non-expired reservations.
    # This is a point-in-time read, not a guarantee: the reservation revalidates under lock (RN05).
    return max(0, session.capacity - counts.tickets_sold - counts.reserved_open)

def session_status(session: Session, available: int, now: datetime) -> str:
    if session.status is SessionStatus.CANCELLED:
        return "cancelled"
    if session.starts_at <= now:
        return "closed"
    if available <= 0:
        return "sold_out"

    return "on_sale"

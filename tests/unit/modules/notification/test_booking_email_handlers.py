import pytest

from app.modules.notification import handlers
from app.outbox.registry import handlers_for

# N3: N2 added OrderPaid/OrderCancelled to the outbox. The relay only knows a
# handler by its registered event_type, so a typo in either side silently drops
# the e-mail. These tests pin the wiring and the rendered content.

class _FakeEmailService:
    def __init__(self) -> None:
        self.sent: list[tuple[str, str, str]] = []

    async def send(self, to: str, subject: str, html_body: str) -> None:
        self.sent.append((to, subject, html_body))

@pytest.fixture
def outbox_email(monkeypatch):
    fake = _FakeEmailService()
    monkeypatch.setattr(handlers, "get_email_service", lambda: fake)

    return fake

def _order_payload(**overrides) -> dict:
    payload = {
        "email": "comprador@example.com",
        "order_id": "00000000-0000-0000-0000-000000000001",
        "show_title": "Hamlet <comunitário>",
        "session_starts_at": "2026-12-01T20:00:00+00:00",
        "venue": "Teatro",
        "amount_cents": 6000,
    }
    payload.update(overrides)

    return payload

def test_booking_events_are_registered_in_the_outbox():
    assert handlers.handle_order_paid in handlers_for("OrderPaid")
    assert handlers.handle_order_cancelled in handlers_for("OrderCancelled")

async def test_order_paid_sends_one_email_with_every_ticket_code_escaped(outbox_email):
    tickets = [
        {"ticket_type": "full", "code": "LUD-AAA", "price_cents": 4000},
        {"ticket_type": "half", "code": "LUD-BBB", "price_cents": 2000},
    ]

    await handlers.handle_order_paid(_order_payload(tickets=tickets))

    assert len(outbox_email.sent) == 1
    to, _, body = outbox_email.sent[0]
    assert to == "comprador@example.com"
    assert "LUD-AAA" in body and "LUD-BBB" in body
    assert "R$ 60.00" in body
    assert "Hamlet &lt;comunitário&gt;" in body

@pytest.mark.parametrize("origin,subject_fragment", [("buyer", "Pedido cancelado"), ("session", "Sessão cancelada")])
async def test_order_cancelled_subject_depends_on_who_cancelled(outbox_email, origin, subject_fragment):
    payload = _order_payload(origin=origin, reason="Mudei de planos", ticket_count=2, refund_percent=50, refund_cents=3000)

    await handlers.handle_order_cancelled(payload)

    _, subject, body = outbox_email.sent[0]
    assert subject_fragment in subject
    assert "50%" in body and "R$ 30.00" in body

async def test_order_cancelled_without_buyer_email_is_skipped(outbox_email):
    payload = _order_payload(email=None, origin="session", reason="Sessão cancelada", ticket_count=1, refund_percent=100, refund_cents=6000)

    await handlers.handle_order_cancelled(payload)

    assert outbox_email.sent == []

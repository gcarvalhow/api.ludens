from datetime import datetime, timedelta, timezone
from uuid import uuid4

from app.modules.catalog.application.usecases.session_query_usecase import (
    _available_count,
    _status,
)
from app.modules.catalog.domain.aggregates import Session
from app.modules.catalog.infrastructure.repositories import SeatCounts

def _session(capacity: int = 100, dias: int = 10, preco: int = 4000) -> Session:
    now = datetime.now(timezone.utc)

    return Session.create(
        show_id=uuid4(),
        starts_at=now + timedelta(days=dias),
        venue="Sala 1",
        capacity=capacity,
        full_price_cents=preco,
        now=now,
    )

def test_disponivel_desconta_vendidos_e_reservas_abertas():
    session = _session(capacity=100)

    assert _available_count(session, SeatCounts(tickets_sold=30, reserved_open=20)) == 50

def test_disponivel_nunca_e_negativo():
    session = _session(capacity=10)

    assert _available_count(session, SeatCounts(tickets_sold=8, reserved_open=5)) == 0

def test_status_a_venda_quando_ha_lugar_e_a_sessao_e_futura():
    session = _session()

    assert _status(session, 50, datetime.now(timezone.utc)) == "on_sale"

def test_status_esgotado_quando_nao_sobra_lugar():
    session = _session()

    assert _status(session, 0, datetime.now(timezone.utc)) == "sold_out"

def test_status_encerrado_depois_do_inicio_da_sessao():
    session = _session(dias=10)

    depois = session.starts_at + timedelta(hours=1)

    assert _status(session, 50, depois) == "closed"

def test_status_cancelado_vence_encerrado_e_esgotado():
    session = _session(dias=10)
    session.cancel()

    depois = session.starts_at + timedelta(hours=1)

    assert _status(session, 0, depois) == "cancelled"

def test_meia_entrada_e_metade_da_inteira():
    # RN04 — derivada do preço da sessão, nunca digitada.
    session = _session(preco=5000)

    assert session.half_price_cents == 2500

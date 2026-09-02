"""Outbox Relay in-process (ADR 001 — docs.ludens/backend/design/001-outbox-in-process.md).

Roda como asyncio.Task de background (ver `main.py` lifespan). A cada
`OUTBOX_RELAY_INTERVAL_SECONDS` faz polling da tabela `events`, chama os handlers
registrados por `event_type` no mesmo processo e marca `dispatched_at`. Não há
broker. Entrega at-least-once — handlers precisam ser idempotentes.
"""

import asyncio
import logging
from datetime import datetime, timezone

from sqlalchemy import select

from app.config import settings
from app.core.shared.health import beat
from app.database import AsyncSessionLocal
from app.outbox.models import Event
from app.outbox.registry import handlers_for

logger = logging.getLogger(__name__)

BATCH_SIZE = 50


async def _process_batch() -> None:
    async with AsyncSessionLocal() as session:
        async with session.begin():
            # skip_locked: se um dia houver mais de um processo do relay, cada um
            # pega um lote diferente em vez de esperar o outro.
            result = await session.execute(
                select(Event)
                .where(Event.dispatched_at.is_(None))
                .order_by(Event.created_at)
                .limit(BATCH_SIZE)
                .with_for_update(skip_locked=True)
            )
            events = list(result.scalars().all())

            for event in events:
                handlers = handlers_for(event.event_type)
                try:
                    for handler in handlers:
                        await handler(event.payload)
                except asyncio.CancelledError:
                    raise
                except Exception as exc:  # noqa: BLE001
                    # não marca dispatched_at — o evento é reprocessado na próxima volta
                    logger.error(
                        "OutboxRelay: handler de %s (evento %s) falhou: %s",
                        event.event_type, event.id, exc,
                    )
                    continue

                event.dispatched_at = datetime.now(timezone.utc)


async def run() -> None:
    interval = settings.outbox_relay_interval_seconds
    while True:
        beat("outbox_relay")
        try:
            await _process_batch()
        except asyncio.CancelledError:
            raise
        except Exception as exc:  # noqa: BLE001
            logger.error("OutboxRelay: erro no lote: %s", exc)
        await asyncio.sleep(interval)

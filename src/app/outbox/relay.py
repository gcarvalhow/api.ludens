import asyncio
import logging
from datetime import datetime, timezone

from sqlalchemy import select

from app.config import settings
from app.database import AsyncSessionLocal
from app.outbox.models import Event
from app.outbox.registry import handlers_for

logger = logging.getLogger(__name__)

BATCH_SIZE = 50

async def _process_batch() -> None:
    async with AsyncSessionLocal() as session:
        async with session.begin():
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
                    logger.error(
                        "OutboxRelay: handler de %s (evento %s) falhou: %s",
                        event.event_type, event.id, exc,
                    )
                    continue

                event.dispatched_at = datetime.now(timezone.utc)

async def run() -> None:
    interval = settings.outbox_relay_interval_seconds

    while True:
        try:
            await _process_batch()
        except asyncio.CancelledError:
            raise
        except Exception as exc:  # noqa: BLE001
            logger.error("OutboxRelay: erro no lote: %s", exc)
            
        await asyncio.sleep(interval)

"""Registry de handlers do Outbox in-process (ADR 001).

Cada módulo registra seus handlers no import (o `main.py` importa
`app.modules.<mod>.handlers` no boot). O relay procura aqui os handlers de cada
`event_type` e os chama no mesmo processo — sem broker.

Contrato do handler: `async def handler(payload: dict) -> None`. Deve ser
**idempotente** (a entrega é at-least-once).
"""

from collections import defaultdict
from typing import Awaitable, Callable

Handler = Callable[[dict], Awaitable[None]]

_handlers: dict[str, list[Handler]] = defaultdict(list)


def register(event_type: str) -> Callable[[Handler], Handler]:
    def decorator(fn: Handler) -> Handler:
        _handlers[event_type].append(fn)
        return fn

    return decorator


def handlers_for(event_type: str) -> list[Handler]:
    return list(_handlers[event_type])

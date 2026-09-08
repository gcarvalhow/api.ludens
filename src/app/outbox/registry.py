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

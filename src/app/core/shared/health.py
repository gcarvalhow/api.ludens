import time

_heartbeats: dict[str, float] = {}

def beat(name: str) -> None:
    _heartbeats[name] = time.monotonic()

def seconds_since_beat(name: str) -> float | None:
    last = _heartbeats.get(name)
    if last is None:
        return None
    
    return time.monotonic() - last

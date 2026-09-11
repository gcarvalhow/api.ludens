import re
import unicodedata

_SYNOPSIS_MAX = 160

def synopsis_short(synopsis: str) -> str:
    if len(synopsis) <= _SYNOPSIS_MAX:
        return synopsis

    return synopsis[: _SYNOPSIS_MAX - 1].rstrip() + "…"

def slugify(genre: str) -> str:
    ascii_only = unicodedata.normalize("NFKD", genre).encode("ascii", "ignore").decode("ascii")

    return re.sub(r"[^a-z0-9]+", "-", ascii_only.lower()).strip("-")

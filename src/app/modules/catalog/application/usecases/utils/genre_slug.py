import re
import unicodedata

def slugify(genre: str) -> str:
    ascii_only = unicodedata.normalize("NFKD", genre).encode("ascii", "ignore").decode("ascii")

    return re.sub(r"[^a-z0-9]+", "-", ascii_only.lower()).strip("-")

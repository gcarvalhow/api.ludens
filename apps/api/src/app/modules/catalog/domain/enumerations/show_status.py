from __future__ import annotations

import enum

class ShowStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"

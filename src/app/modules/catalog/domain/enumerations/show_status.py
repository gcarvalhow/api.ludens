from __future__ import annotations

import enum


class ShowStatus(str, enum.Enum):
    # "inativo" (excluído) não é um valor aqui — é is_active=False no Model.
    DRAFT = "draft"
    PUBLISHED = "published"

from __future__ import annotations

from app.modules.catalog.domain.aggregates import Show
from app.core.infrastructure.repositories import AggregateRepository

class ShowRepository(AggregateRepository[Show]):
    model = Show

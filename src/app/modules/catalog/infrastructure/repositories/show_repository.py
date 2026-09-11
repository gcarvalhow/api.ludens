from __future__ import annotations

from app.core.infrastructure.repositories import AggregateRepository
from app.modules.catalog.domain.aggregates import Show

class ShowRepository(AggregateRepository[Show]):
    model = Show

from __future__ import annotations

from app.core.infrastructure.repositories.repository import AggregateRepository
from app.modules.catalog.domain.aggregates.show import Show


class ShowRepository(AggregateRepository[Show]):
    model = Show

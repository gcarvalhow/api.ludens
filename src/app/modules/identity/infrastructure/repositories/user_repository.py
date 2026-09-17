from app.modules.identity.domain.aggregates import User
from app.core.infrastructure.repositories import AggregateRepository

class UserRepository(AggregateRepository[User]):
    model = User

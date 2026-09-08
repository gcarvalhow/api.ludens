from app.core.infrastructure.repositories import AggregateRepository
from app.modules.identity.domain.aggregates import User

class UserRepository(AggregateRepository[User]):
    model = User

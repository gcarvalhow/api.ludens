from app.core.infrastructure.repositories import AggregateRepository
from app.modules.identity.domain.aggregates.buyer import Buyer


class BuyerRepository(AggregateRepository[Buyer]):
    # AggregateRepository: o save() drena os eventos do Buyer para o outbox na
    # mesma transacao. find_by ja filtra is_active.
    model = Buyer

    async def find_by_email(self, email: str) -> Buyer | None:
        return await self.find_by("email", email)

    async def find_by_cpf(self, cpf: str) -> Buyer | None:
        return await self.find_by("cpf", cpf)

from uuid import UUID
from typing import Any, ClassVar, Generic, Sequence, TypeVar

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.outbox.models import Event
from app.core.domain.model import Model
from app.core.domain.events import DomainEvent

T = TypeVar("T", bound=Model)

class BaseRepository(Generic[T]):
    model: ClassVar[type]

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def find_by_id(self, entity_id: UUID) -> T | None:
        entity = await self._session.get(self.model, entity_id)
        return entity if entity and entity.is_active else None

    async def find_by_ids(self, ids: list[UUID]) -> list[T]:
        if not ids:
            return []

        # `== True` (e não `is True`): numa cláusula WHERE do SQLAlchemy a
        # comparação precisa ser explícita para virar SQL — daí o noqa E712.
        result = await self._session.execute(
            select(self.model).where(self.model.id.in_(ids), self.model.is_active == True)  # noqa: E712
        )

        return list(result.scalars().all())

    async def find_by(self, field: str, value: Any) -> T | None:
        column = getattr(self.model, field)
        stmt = select(self.model).where(column == value, self.model.is_active == True)  # noqa: E712

        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def find_all(self, *, order_by: Sequence[str] | None = None) -> list[T]:
        return await self.find_all_by(order_by=order_by)

    async def find_all_by(self, *, order_by: Sequence[str] | None = None, **filters: Any) -> list[T]:
        stmt = select(self.model).where(self.model.is_active == True)  # noqa: E712

        for field, value in filters.items():
            stmt = stmt.where(getattr(self.model, field) == value)

        for field in order_by or []:
            descending = field.startswith("-")
            column = getattr(self.model, field[1:] if descending else field)
            stmt = stmt.order_by(column.desc() if descending else column.asc())

        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def find_by_id_for_update(self, entity_id: UUID) -> T | None:
        # SELECT ... FOR UPDATE: trava a linha até o fim da transação. Usar em
        # toda operação que decide sobre disponibilidade sob concorrência
        # (reservar/confirmar/liberar assento — RN05), nunca leitura + update.
        result = await self._session.execute(
            select(self.model).where(self.model.id == entity_id, self.model.is_active == True).with_for_update()  # noqa: E712
        )

        return result.scalar_one_or_none()

    async def exists_by(self, field: str, value: Any) -> bool:
        column = getattr(self.model, field)
        result = await self._session.execute(
            select(self.model.id).where(column == value, self.model.is_active == True).limit(1)  # noqa: E712
        )

        return result.scalar_one_or_none() is not None

    async def save(self, entity: T) -> None:
        self._session.add(entity)

class AggregateRepository(BaseRepository[T]):
    # save() grava as linhas `Event` na MESMA transação que persiste o agregado —
    # é o que garante o Outbox (a mudança de domínio e o evento vão juntos ou não
    # vão). Nenhum módulo escreve na tabela `events` diretamente.
    async def save(self, entity: T) -> None:  # type: ignore[override]
        self._session.add(entity)

        for event in entity.dequeue_events():  # type: ignore[attr-defined]
            self._session.add(Event(
                aggregate_id=entity.id,
                event_type=event.__class__.__name__,
                payload=self._serialize(event),
            ))

    def _serialize(self, event: DomainEvent) -> dict:
        # Campos que não são primitivos JSON (UUID, datetime, Enum) viram string.
        return {
            k: str(v) if not isinstance(v, (str, int, float, bool, list, dict, type(None))) else v
            for k, v in vars(event).items()
        }

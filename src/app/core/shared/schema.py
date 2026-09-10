from __future__ import annotations

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Base de schema de I/O da API.

    Serializa em camelCase (contrato do frontend) e mantém os nomes em
    snake_case no Python. `populate_by_name=True` aceita as duas grafias na
    entrada; `from_attributes=True` permite `model_validate(orm_obj)`.
    """

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )

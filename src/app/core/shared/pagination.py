from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Generic, TypeVar

from fastapi import Query
from pydantic import BaseModel

T = TypeVar("T")

class Page(BaseModel, Generic[T]):
    items: list[T]
    page: int
    size: int
    total: int

@dataclass(frozen=True)
class PaginationParams:
    page: int
    size: int

def make_pagination_params(*, default_size: int = 20, max_size: int = 50) -> Callable[..., PaginationParams]:
    def _params(page: int = Query(default=1, ge=1), size: int = Query(default=default_size, ge=1, le=max_size)) -> PaginationParams:
        return PaginationParams(page=page, size=size)

    return _params

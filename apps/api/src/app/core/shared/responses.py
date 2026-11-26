from uuid import UUID
from pydantic import BaseModel, Field

class IdentifierResponse(BaseModel):
    id: UUID = Field(description="Identificador unico do recurso recem-criado.", examples=["3fa85f64-5717-4562-b3fc-2c963f66afa6"])

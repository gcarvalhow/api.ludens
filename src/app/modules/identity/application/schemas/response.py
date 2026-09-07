from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

class TokenResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    access_token: str = Field(serialization_alias="accessToken")
    expires_in: int = Field(serialization_alias="expiresIn")

class UserResponse(BaseModel):
    id: UUID
    name: str
    email: str
    cpf: str
    is_admin: bool

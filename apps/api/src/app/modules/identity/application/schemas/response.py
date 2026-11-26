from uuid import UUID
from pydantic import BaseModel

class TokenResponse(BaseModel):
    access_token: str
    expires_in: int

class UserResponse(BaseModel):
    id: UUID
    name: str
    email: str
    cpf: str
    is_admin: bool

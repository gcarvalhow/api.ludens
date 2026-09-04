from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TokenResponse(BaseModel):
    # Serializa em camelCase para casar com o contrato de integracao
    # (accessToken / expiresIn). O refresh token nunca vai no corpo — so' no
    # cookie HttpOnly.
    model_config = ConfigDict(populate_by_name=True)

    access_token: str = Field(serialization_alias="accessToken")
    expires_in: int = Field(serialization_alias="expiresIn")


class BuyerResponse(BaseModel):
    id: UUID
    name: str
    email: str
    cpf: str
    role: str


class MessageResponse(BaseModel):
    message: str

from pydantic import BaseModel, ConfigDict, Field

class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    cpf: str = Field(min_length=11, max_length=11)
    email: str = Field(max_length=254)
    password: str = Field(min_length=8)

class LoginRequest(BaseModel):
    email: str
    password: str

class ChangePasswordRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    current_password: str = Field(alias="currentPassword")
    new_password: str = Field(alias="newPassword", min_length=8)

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    password: str = Field(min_length=8)

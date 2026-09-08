from pydantic import BaseModel, Field

class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    cpf: str = Field(min_length=11, max_length=11)
    email: str = Field(max_length=254)
    password: str = Field(min_length=8)

class LoginRequest(BaseModel):
    email: str
    password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    password: str = Field(min_length=8)

from app.modules.identity.domain.aggregates import User
from app.modules.identity.application.schemas.response import UserResponse

def user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id, name=user.name, email=user.email, cpf=user.cpf, is_admin=user.is_admin
    )

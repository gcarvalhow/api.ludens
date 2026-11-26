import asyncio
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import AsyncSessionLocal  # noqa: E402
from app.modules.identity.domain.aggregates import User  # noqa: E402
from app.modules.identity.domain.value_objects import CPF, Email  # noqa: E402
from app.modules.identity.infrastructure.repositories import UserRepository  # noqa: E402
from app.modules.identity.infrastructure.services import PasswordService  # noqa: E402

async def seed_admin() -> None:
    name = os.environ.get("ADMIN_NAME", "Administrador Ludens")
    cpf = os.environ.get("ADMIN_CPF", "")
    email = os.environ.get("ADMIN_EMAIL", "").strip().lower()
    password = os.environ.get("ADMIN_PASSWORD", "")

    if not (cpf and email and password):
        raise SystemExit("Defina ADMIN_CPF, ADMIN_EMAIL e ADMIN_PASSWORD no ambiente.")

    async with AsyncSessionLocal() as session, session.begin():
        users = UserRepository(session)
        if await users.find_by("email", email) is not None:
            print(f"admin já existe: {email}")
            return

        user = User.register(
            name, CPF(cpf), Email(email), PasswordService().hash(password), is_admin=True
        )

        await users.save(user)
        print(f"admin criado: {email}")

if __name__ == "__main__":
    asyncio.run(seed_admin())

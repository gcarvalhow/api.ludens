"""Semeia o comprador ADMIN (RF08), fora do fluxo publico.

A criacao de administrador nao existe pela interface (ver escopo negativo da
spec identity-auth) — o admin e' semeado por este script. Idempotente: nao
recria se ja houver conta com o e-mail.

Uso (da raiz do repo, com o banco no ar e as migrations aplicadas):

    ADMIN_NAME="..." ADMIN_CPF=... ADMIN_EMAIL=... ADMIN_PASSWORD=... \
        python scripts/seed_admin.py
"""

import asyncio
import os
import sys

# Permite rodar da raiz do repo sem instalar o pacote (src/ no path).
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from app.database import AsyncSessionLocal  # noqa: E402
from app.modules.identity.domain.aggregates.buyer import Buyer  # noqa: E402
from app.modules.identity.domain.enumerations.role import Role  # noqa: E402
from app.modules.identity.domain.value_objects.cpf import CPF  # noqa: E402
from app.modules.identity.domain.value_objects.email import Email  # noqa: E402
from app.modules.identity.infrastructure.repositories import BuyerRepository  # noqa: E402
from app.modules.identity.infrastructure.services import PasswordHasher  # noqa: E402


async def seed_admin() -> None:
    name = os.environ.get("ADMIN_NAME", "Administrador Ludens")
    cpf = os.environ.get("ADMIN_CPF", "")
    email = os.environ.get("ADMIN_EMAIL", "").strip().lower()
    password = os.environ.get("ADMIN_PASSWORD", "")
    if not (cpf and email and password):
        raise SystemExit("Defina ADMIN_CPF, ADMIN_EMAIL e ADMIN_PASSWORD no ambiente.")

    async with AsyncSessionLocal() as session, session.begin():
        buyers = BuyerRepository(session)
        if await buyers.find_by_email(email) is not None:
            print(f"admin já existe: {email}")
            return
        buyer = Buyer.register(
            name, CPF(cpf), Email(email), PasswordHasher().hash(password), role=Role.ADMIN
        )
        await buyers.save(buyer)
        print(f"admin criado: {email}")


if __name__ == "__main__":
    asyncio.run(seed_admin())

from __future__ import annotations

# Violacao de invariante de dominio. O dominio nunca importa HTTPException — ele
# levanta DomainError (ou uma subclasse) e a camada de API traduz para o status
# HTTP adequado (ver app/main.py). O padrao esta descrito na skill
# backend-architecture (references/02) e em docs.ludens/backend/code-style.md.


class DomainError(Exception):
    # Regra de negocio violada. Padrao: 422 na camada de API.
    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class ConflictError(DomainError):
    # Conflito com estado ja persistido (ex.: CPF/e-mail ja cadastrado) -> 409.
    pass


class AuthError(DomainError):
    # Credencial invalida ou sessao nao autenticada -> 401.
    pass


class ForbiddenError(DomainError):
    # Autenticado, mas sem permissao para a operacao (ex.: nao-admin) -> 403.
    pass


class GoneError(DomainError):
    # Recurso de uso unico ja consumido ou expirado (ex.: link de reset) -> 410.
    pass

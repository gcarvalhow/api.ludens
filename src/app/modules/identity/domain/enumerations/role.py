import enum


class Role(str, enum.Enum):
    # Papel binario, sem permissao granular (ver
    # docs.ludens/backend/security/authentication.md). ADMIN e' semeado por
    # script (scripts/seed_admin.py), nunca pelo fluxo publico.
    BUYER = "buyer"
    ADMIN = "admin"

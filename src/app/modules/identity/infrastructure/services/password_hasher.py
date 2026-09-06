import bcrypt


class PasswordHasher:
    # Hash de senha com bcrypt (salt automatico). A senha em claro nunca e'
    # guardada, logada nem devolvida (RNF01).

    def hash(self, plain: str) -> str:
        return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    def verify(self, plain: str, hashed: str) -> bool:
        try:
            return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
        except ValueError:
            # hash malformado no banco — trata como nao-confere, sem vazar o motivo.
            return False

from __future__ import annotations

class DomainError(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message

class ConflictError(DomainError):
    pass

class AuthError(DomainError):
    pass

class ForbiddenError(DomainError):
    pass

class GoneError(DomainError):
    pass

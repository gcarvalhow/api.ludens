from typing import Protocol

class EmailServiceError(Exception):
    pass

class EmailService(Protocol):
    async def send(self, to: str, subject: str, html_body: str) -> None:
        ...

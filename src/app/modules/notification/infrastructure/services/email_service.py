from typing import Protocol

class EmailService(Protocol):
    """Interface estrutural (structural typing) para envio de e-mail — sem
    lógica própria. Implementações reais: AcsEmailService (prod) e
    SmtpEmailService (dev), escolhidas em factory.py::get_email_service()."""

    async def send(self, to: str, subject: str, html_body: str) -> None:
        ...

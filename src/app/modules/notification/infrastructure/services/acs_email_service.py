from azure.communication.email.aio import EmailClient
from azure.core.exceptions import AzureError

from app.config import settings

from app.modules.notification.shared import EmailServiceError

class AcsEmailService:
    async def send(self, to: str, subject: str, html_body: str) -> None:
        message = {
            "senderAddress": settings.acs_sender_address,
            "recipients": {"to": [{"address": to}]},
            "content": {"subject": subject, "html": html_body},
        }

        try:
            async with EmailClient.from_connection_string(
                settings.acs_connection_string, connection_timeout=5, read_timeout=10
            ) as client:
                poller = await client.begin_send(message)
                await poller.result()
        except AzureError as exc:
            raise EmailServiceError(f"Falha ao enviar e-mail via ACS para {to}: {exc}") from exc

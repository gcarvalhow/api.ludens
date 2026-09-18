import aiosmtplib

from email.message import EmailMessage

from app.config import settings

from app.modules.notification.shared import EmailServiceError

class SmtpEmailService:
    async def send(self, to: str, subject: str, html_body: str) -> None:
        message = EmailMessage()
        message["From"] = f"{settings.email_from_name} <{settings.email_from_address}>"
        message["To"] = to
        message["Subject"] = subject
        message.set_content(html_body, subtype="html")

        try:
            await aiosmtplib.send(message, hostname=settings.smtp_host, port=settings.smtp_port, timeout=10)
        except aiosmtplib.SMTPException as exc:
            raise EmailServiceError(f"Falha ao enviar e-mail via SMTP para {to}: {exc}") from exc

from functools import lru_cache

from app.config import settings

from app.modules.notification.infrastructure.services.email_service import EmailService
from app.modules.notification.infrastructure.services.acs_email_service import AcsEmailService
from app.modules.notification.infrastructure.services.smtp_email_service import SmtpEmailService

@lru_cache
def get_email_service() -> EmailService:
    if settings.email_backend == "acs":
        return AcsEmailService()

    return SmtpEmailService()

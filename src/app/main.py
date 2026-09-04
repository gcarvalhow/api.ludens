import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.core.domain.errors import AuthError, ConflictError, DomainError, ForbiddenError, GoneError
from app.core.shared.errors import format_validation_errors
from app.core.shared.health import seconds_since_beat
from app.modules.identity.router import router as identity_router
from app.outbox.relay import run as run_outbox_relay

logger = logging.getLogger(__name__)

BACKGROUND_TASK_MAX_AGE_SECONDS = {"outbox_relay": 20}

@asynccontextmanager
async def lifespan(app: FastAPI):
    tasks = [
        asyncio.create_task(run_outbox_relay()),
    ]

    yield

    for task in tasks:
        task.cancel()

app = FastAPI(title="Ludens API", version="0.1.0", lifespan=lifespan)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": format_validation_errors(exc.errors())},
    )

# Violacao de invariante de dominio -> HTTP. O dominio nunca conhece HTTP; a
# traducao vive aqui (ver core/domain/errors.py e a skill backend-architecture).
_DOMAIN_ERROR_STATUS = [
    (ConflictError, 409),
    (AuthError, 401),
    (ForbiddenError, 403),
    (GoneError, 410),
]

@app.exception_handler(DomainError)
async def domain_exception_handler(request: Request, exc: DomainError):
    status_code = next((s for t, s in _DOMAIN_ERROR_STATUS if isinstance(exc, t)), 422)
    return JSONResponse(status_code=status_code, content={"detail": exc.message})

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(identity_router)

@app.get("/health")
async def health():
    stale = [
        name
        for name, max_age in BACKGROUND_TASK_MAX_AGE_SECONDS.items()
        if (age := seconds_since_beat(name)) is not None and age > max_age
    ]

    if stale:
        return JSONResponse(status_code=503, content={"status": "unhealthy", "stale": stale})
    
    return {"status": "ok", "environment": settings.environment}

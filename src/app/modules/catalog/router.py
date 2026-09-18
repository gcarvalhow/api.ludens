from fastapi import APIRouter

from app.modules.catalog.api.routers.session_router import router as session_router
from app.modules.catalog.api.routers.show_router import router as show_router

router = APIRouter(prefix="/catalog")
router.include_router(show_router)
router.include_router(session_router)

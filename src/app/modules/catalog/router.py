from fastapi import APIRouter

from app.modules.catalog.api.routers.admin_catalog_router import router as admin_catalog_router

router = APIRouter()
router.include_router(admin_catalog_router)

from fastapi import APIRouter

from app.modules.identity.api.routers.auth_router import router as auth_router

# Agregador do modulo. main.py inclui so' este router de topo, nunca um
# <recurso>_router diretamente.
router = APIRouter()
router.include_router(auth_router)

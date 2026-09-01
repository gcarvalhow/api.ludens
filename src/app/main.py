from fastapi import FastAPI

from app.config import get_settings

app = FastAPI(title="Ludens API", version="0.1.0")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "environment": get_settings().environment}


# Os routers de cada módulo (identity, catalog, booking, payment) são
# registrados aqui à medida que cada feature é implementada — ver
# docs.ludens/backend/overview.md e as specs em docs.ludens/specs/.

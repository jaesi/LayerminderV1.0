from fastapi import FastAPI
from fastapi.security import HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
import uvicorn, os

from core.config import settings

# routers
from routers.history import router as history_router
from routers.image_metadata import router as image_meta_router
from routers.generation import router as generation_router
from routers.auth import router as auth_router
from routers.streaming import router as streaming_router
from routers.layerroom import router as layer_room_router
from routers.layerroom_image import router as layer_room_image_router
from routers.image_view import router as image_view_router
from routers.credits import router as credits_router

app = FastAPI(title="LayerMinder API v1.0")

# Security scheme
bearer_scheme = HTTPBearer(bearerFormat="JWT", scheme_name="bearerAuth")

# router setting
app.include_router(auth_router, prefix="/api/v1")
app.include_router(history_router, prefix="/api/v1")
app.include_router(image_meta_router, prefix="/api/v1")
app.include_router(image_view_router, prefix="/api/v1")
app.include_router(generation_router, prefix="/api/v1")
app.include_router(streaming_router, prefix="/api/v1")
app.include_router(layer_room_router, prefix="/api/v1")
app.include_router(layer_room_image_router, prefix="/api/v1")
app.include_router(credits_router, prefix="/api/v1")


# CORS setting
ALLOWED_ORIGINS = [
    "http://localhost:7777",
    "http://localhost:3000", 
    "https://layerminder.com",
    "https://www.layerminder.com",
    "https://layerminder-v1-0-3tt6.vercel.app",
]

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=app.title,
        version="1.0.0",
        description="LayerMinder API",
        routes=app.routes,
    )
    openapi_schema.setdefault("components", {})["securitySchemes"] = {
        "bearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }
    for path in openapi_schema.get("paths", {}).values():
        for op in path.values():
            op.setdefault("security", []).append({"bearerAuth": []})
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi

if __name__ == "__main__":
    uvicorn.run("run:app", host="0.0.0.0", port=8000, reload=False)
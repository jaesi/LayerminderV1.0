from fastapi import FastAPI
from fastapi.security import HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
import uvicorn


from core.config import settings
# routers
from routers.rooms import router as rooms_router
from routers.image_metadata import router as image_meta_router
from routers.generation import router as generation_router
from routers.upload import router as upload_router
from routers.auth import router as auth_router

app = FastAPI(title="LayerMinder API v1.0")

# Security scheme
bearer_scheme = HTTPBearer(bearerFormat="JWT", scheme_name="bearerAuth")

# router setting 
app.include_router(auth_router, prefix="/api/v1")
app.include_router(rooms_router, prefix="/api/v1")
app.include_router(image_meta_router, prefix="/api/v1")
app.include_router(generation_router, prefix="/api/v1")
app.include_router(upload_router, prefix="/api/v1")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:7777"],
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
    uvicorn.run("run:app", host="127.0.0.1", port=8000, reload=True)
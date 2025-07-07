from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
import uvicorn

# routers
from routers.rooms import router as rooms_router
from routers.image_metadata import router as image_meta_router
from routers.generation import router as generation_router

app = FastAPI(title="LayerMinder API v1.0")

# router setting 
app.include_router(rooms_router, prefix="/api/v1")
app.include_router(image_meta_router, prefix="/api/v1")
app.include_router(generation_router, prefix="/api/v1")

# middleware setting
origins = [
    "http://localhost:7777"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins = origins,
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers=["*"]
)

if __name__ == "__main__":
    uvicorn.run("run:app", host="127.0.0.1", port=8000, reload=True)
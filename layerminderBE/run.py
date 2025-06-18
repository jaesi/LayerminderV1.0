from fastapi import FastAPI
from routers.rooms import router as rooms_router
from routers.upload import router as upload_router
from routers.image_meta import router as image_meta_router
from routers.generation import router as generation_router
from core.config import settings
from dotenv import load_dotenv 
import uvicorn

load_dotenv()

app = FastAPI(title="LayerMinder API v1.0")

# router setting 
app.include_router(rooms_router, prefix="/api/v1/rooms")
app.include_router(upload_router, prefix="/api/v1")
app.include_router(image_meta_router, prefix="/api/v1")
app.include_router(generation_router, prefix="/api/v1")

if __name__ == "__main__":
    uvicorn.run("run:app", host="127.0.0.1", port=8000, reload=True)
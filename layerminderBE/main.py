from fastapi import FastAPI
from routers.rooms import router as rooms_router
import uvicorn

app = FastAPI(title="LayerMinder API v1.0")
app.include_router(rooms_router, prefix="/api/rooms")


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
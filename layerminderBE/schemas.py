# Pydantic 모델 정의할 곳
from pydantic import BaseModel

class Room(BaseModel):
    id: str
    title: str

class RoomCreate(BaseModel):
    title: str
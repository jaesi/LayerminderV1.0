# Pydantic 모델 정의할 곳
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class Room(BaseModel):
    id: str
    title: str
    created_time: Optional[datetime] = None

class RoomCreate(BaseModel):
    title: str

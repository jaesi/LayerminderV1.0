# Pydantic 모델 정의할 곳
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class Room(BaseModel):
    id: str
    title: str
    created_time: Optional[datetime] = None

class RoomCreate(BaseModel):
    title: str

class UserCreate(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer" # 기본값 

# image generation api

class ImageGenerationRequest(BaseModel):
    user_id: str
    input_image_ids: List[str] = Field(..., min_items=1, max_items=2)
    keyword: Optional[str] = None

class GeneratedImageResponse(BaseModel):
    image_id: str
    s3url: str

class ImageGenerationResponse(BaseModel):
    generated_images: List[GeneratedImageResponse]
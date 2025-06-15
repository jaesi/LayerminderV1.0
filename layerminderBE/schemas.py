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

class GenerateImageRequest(BaseModel):
    userId: str
    inputImageId: str
    keywords: List[str]
    style: Optional[str] = None

class GeneratedImageResponse(BaseModel):
    imageId: str
    s3url: str

class GenerateImageResponse(BaseModel):
    generatedImages: List[GeneratedImageResponse]
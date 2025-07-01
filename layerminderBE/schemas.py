# Pydantic 모델 정의할 곳
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime

# auth
class SocialLoginRequest(BaseModel):
    access_token: str  # (kakao, google -> access_token/id_token)
    
class SocialLoginResponse(BaseModel):
    success: bool
    user_id: str
    token: str  # JWT served by us
    email: str = None
    name: str = None

# Room
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

# Presigned URL API

class PresignedUrlRequest(BaseModel):
    userId: str
    fileType: str

class PresignedUrlResponse(BaseModel):
    uploadUrl: str
    fileKey: str
    expiresIn: int

# Image meta data API

class ImageMetadataRequest(BaseModel):
    user_id: str
    file_key: str
    image_key: str
    type: str           # ex. "user_upload"
    meta: Optional[dict] = None 

class ImageMetadataResponse(BaseModel):
    success: bool
    image_id: str
    created_at: str

# image generation api

class ImageMetaIn(BaseModel):
    image_key: str
    user_id: str

class ImageGenerationRequest(BaseModel):
    user_id: str
    input_image_keys: List[str] = Field(..., min_items=1, max_items=2)
    keyword: Optional[str] = None

class GeneratedImageResponse(BaseModel):
    image_id: str
    url: str

class ImageGenerationResponse(BaseModel):
    generated_images: List[GeneratedImageResponse]


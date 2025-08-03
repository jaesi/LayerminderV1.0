# Pydantic 모델 정의할 곳
from pydantic import BaseModel, Field, EmailStr, HttpUrl
from uuid import UUID
from typing import List, Dict, Optional, Any
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

# After log-in
class ProfileResponse(BaseModel):
    id: str
    email: Optional[EmailStr] = None
    nickname: Optional[str] = None
    user_metadata: Dict[str, Any]

# History Session
class HistorySession(BaseModel):
    id: str
    user_id: str
    created_at: str

# Image meta data upload
class ImageMetadataRequest(BaseModel):
    file_key: str
    type: str

class ImageMetadataResponse(BaseModel):
    image_id: UUID
    url: HttpUrl
    type: str
    created_at: datetime



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

# Upload API
class UploadRequest(BaseModel):
    file_name: str

class UploadResponse(BaseModel):
    presigned_url: str
    file_key: str
    public_url: str

# Presigned URL API

class PresignedUrlRequest(BaseModel):
    userId: str
    fileType: str

class PresignedUrlResponse(BaseModel):
    uploadUrl: str
    fileKey: str
    expiresIn: int

class ImageMetaIn(BaseModel):
    image_key: str
    user_id: str
    
# image generation
class ImageGenerationRequest(BaseModel):
    input_image_keys: List[str] = Field(..., min_items=1, max_items=2)
    keyword: Optional[str] = None

class ImageGenerationResponse(BaseModel):
    image_keys: List[str]
    urls: List[str]

# LayerStory
class StoryGenerationRequest(BaseModel):
    image_keys: List[str] = Field(..., min_items=1, max_items=4)

class StoryGenerationResponse(BaseModel):
    story_id: UUID


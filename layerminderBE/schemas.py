# Pydantic 모델 정의할 곳
from pydantic import BaseModel, Field, EmailStr, HttpUrl, ConfigDict
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
    session_id: str
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

# ImagesRecordInfo
class ImageItem(BaseModel):
    seq: int
    id: str 
    url: str

class ImageRecordInfoOut(BaseModel):
    record_id: UUID
    story: Optional[str] = None
    keywords: list[str] = []
    reference_iamge_url: Optional[str] = None
    images: List[ImageItem] = []

# Room
class RoomCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = False

class RoomUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None

class RoomOut(RoomCreate):
    id: UUID
    owner_id: UUID
    slug: str
    pin_count: int = 0
    created_at: datetime
    updated_at: datetime

class RoomImageCreate(BaseModel):
    image_id: UUID
    note: Optional[str] = None
    seq: Optional[int] = None

class RoomImageOut(BaseModel):
    room_image_id: UUID
    image_id: UUID
    url: str
    note: Optional[str] = None
    seq: int

# Upload API
class UploadRequest(BaseModel):
    file_name: str

class UploadResponse(BaseModel):
    presigned_url: str
    file_key: str
    public_url: str
    
# image generation
class ImageGenerationRequest(BaseModel):
    session_id: UUID
    input_image_keys: List[str] = Field(..., 
                                        min_items=1, 
                                        max_items=2,
                                        description="1~2 image for the generation")
    keyword: Optional[str] = None

class ImageGenerationResponse(BaseModel):
    record_id: UUID
    image_status: str
    model_config = ConfigDict(from_attributes=True)

# LayerStory
class StoryGenerationRequest(BaseModel):
    image_keys: List[str] = Field(..., min_items=1, max_items=4)

class StoryGenerationResponse(BaseModel):
    story_id: UUID
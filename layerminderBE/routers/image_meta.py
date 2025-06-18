'''
사용자가 이미지를 presigned URL 통해서 올리면
image meta data 등록하는 API
'''

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy.orm import Session
from db import SessionLocal
from models import Image
from typing import Optional

router = APIRouter(prefix="/api/v1/image_meta", tags=["images"])

class ImageCreateRequest(BaseModel):
    user_id: str
    file_key: str
    type: str           # ex. "user_upload"
    origin: str         # ex. "upload"
    meta: Optional[dict] = None 

class ImageCreateResponse(BaseModel):
    image_id: str
    s3url: str

S3_BUCKET_URL = "https://layerminder.s3.ap-northeast-2.amazonaws.com"

@router.post("/create", response_model = ImageCreateResponse)
def create_image(req: ImageCreateRequest):
    # for checking if user_id is missing or not
    if not req.user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    db: Session = SessionLocal()
    s3url = f"{S3_BUCKET_URL}/{req.file_key}"
    new_img = Image(
        user_id = req.user_id,
        type=req.type,
        s3url=s3url,
        file_key=req.file_key,
        origin=req.origin,
        meta=req.meta
    )
    db.add(new_img)
    db.commit()
    db.refresh(new_img)
    image_id = str(new_img.id)
    db.close()
    return ImageCreateResponse(image_id=image_id, s3url=s3url)
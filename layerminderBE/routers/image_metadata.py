'''
사용자가 이미지를 presigned URL 통해서 올리면
image meta data 등록하는 API
'''

from fastapi import APIRouter, HTTPException, Depends, status
from schemas import ImageMetadataRequest, ImageMetadataResponse
from core.supabase_client import supabase
from core.config import settings
from auth import get_current_user

from uuid import uuid4
from datetime import datetime, timezone


STORAGE_BUCKET = settings.SUPABASE_STORAGE_BUCKET

router = APIRouter(tags=["images"])

@router.post("/images/metadata", 
             response_model = ImageMetadataResponse,
             status_code=status.HTTP_201_CREATED)
def create_image_metadata(
    req: ImageMetadataRequest,
    user_id: str = Depends(get_current_user)
    ):

    # Generating image_id
    image_id = str(uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    
    # 2) public URL
    public_url = supabase.storage.from_(STORAGE_BUCKET).get_public_url(req.file_key)
    if not public_url:
        raise HTTPException(status_code=400, detail="Invalid file_key")

    # Insert into DB
    images_row = {
        "image_id": image_id,
        "user_id": user_id,
        "url": public_url,
        "type": req.type,
        "created_at": created_at
    }
    resp = supabase.table("images").insert(images_row).execute()
    # error Handling
    if getattr(resp, "error", None):
        raise HTTPException(
            status_code=500,
            detail=f"DB insert failed: {resp.error}"
        )
    
    return ImageMetadataResponse(
        success=True,
        image_id=image_id,
        url=public_url,
        type=req.type,
        created_at=created_at
    )
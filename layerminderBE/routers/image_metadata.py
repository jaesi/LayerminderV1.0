'''
사용자가 이미지를 presigned URL 통해서 올리면
image meta data 등록하는 API
'''

from fastapi import APIRouter, HTTPException
from schemas import ImageMetadataRequest, ImageMetadataResponse
from core.supabase_client import supabase
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/api/v1/image_meta", tags=["images"])

@router.post("/images/metadata", response_model = ImageMetadataResponse)
def create_image(req: ImageMetadataRequest):
    # for checking if user_id is missing or not
    if not req.user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    # Generating image_id
    image_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    public_url = supabase.storage.from_("layerminder").get_public_url(req.image_key)["publicUrl"]

    # Insert into DB
    images_row = {
        "id": image_id,
        "user_id": req.user_id,
        "type": "user-upload",
        "file_key": req.image_key,
        "meta": req.meta,
        "created_at": created_at,
        "url": public_url
    }
    resp = supabase.table("images").insert(images_row).execute()
    
    # error Handling
    if getattr(resp, "error", None):
        raise HTTPException(status_code=500, detail=f"DB insert failed: {resp.error}")

    return ImageMetadataResponse(
        success=True,
        image_id=image_id,
        created_at=created_at
    )
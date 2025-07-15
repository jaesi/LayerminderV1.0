from fastapi import APIRouter, HTTPException, Depends
import uuid

from schemas import UploadRequest, UploadResponse
from core.supabase_client import supabase
from core.config import settings
from auth import get_current_user

router = APIRouter(tags=["upload"])

@router.post("/upload", response_model=UploadResponse)
async def create_presigned_url(
    req: UploadRequest,
    user_id: str =Depends(get_current_user)):

    filename = req.file_name
    file_key = f"uploads/{user_id}/{uuid.uuid4().hex}-{filename}"

    try:
        # 1) generating presigned URL for upload (TTL: 5min)
        signed_data = supabase.storage.from_(settings.SUPABASE_STORAGE_BUCKET).create_signed_url(
            file_key, expires_in=300
        )
        presigned_url = signed_data.get('signedURL') or signed_data.get('signedUrl')
        # 2) generate url for public access
        public_data = supabase.storage.from_(settings.SUPABASE_STORAGE_BUCKET).get_public_url(
            file_key
        )
        public_url = public_data.get('publicURL') or public_data.get('publicUrl')

        return UploadResponse(
            presigned_url=presigned_url,
            file_key=file_key,
            public_url=public_url
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
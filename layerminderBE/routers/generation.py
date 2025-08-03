from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends, status
import asyncio
import uuid
from datetime import datetime, timezone

from core.supabase_client import supabase
from auth import get_current_user
from schemas import ImageGenerationRequest, ImageGenerationResponse
from services.image_generation import generate_and_store_images

router = APIRouter(tags=['AI'])

@router.post(
        "/generate",
          response_model=ImageGenerationResponse,
          status_code=status.HTTP_202_ACCEPTED
)
async def generate_images(
    payload: ImageGenerationRequest,
    backgound_tasks: BackgroundTasks,
    user_id: str=Depends(get_current_user)
):
    # 1) Checking the session
    sess = (
        supabase.table("history_sessions")
        .select("user_id")
        .eq("session_id", str(payload.session_id))
        .single().execute()
    )
    
    if not sess.data or sess.data["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # 2) Create record (pending)
    record_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    supabase.table("history_records").insert({
        "record_id": record_id,
        "session_id": str(payload.session_id),
        "status": "pending",
        "created_at": now,
        "updated_at": now
    }).execute()

    # 3) Apply BackgroundTask
    backgound_tasks.add_task(
        generate_and_store_images,
        record_id,
        payload.input_image_keys,
        user_id,
        payload.keyword
    )

    # 4) Response
    return ImageGenerationResponse(
        record_id=record_id, 
        status="pending",
        )

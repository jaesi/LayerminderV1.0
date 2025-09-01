from fastapi import APIRouter, HTTPException, Depends, status
from uuid import UUID

from core.supabase_client import supabase
from auth import get_current_user
from schemas import ImageRecordInfoOut

router = APIRouter(tags=['images_view'])

# Clicks image
@router.get("/images/{image_id}/record",
            response_model=ImageRecordInfoOut)
def get_image_record_info(
    image_id: UUID,
    user_id: str = Depends(get_current_user)):
    
    # 1) From view, get the rows that matches user_id, image_id
    rec = (supabase.table("history_record_images")
             .select("record_id")
             .eq("image_id", str(image_id))
             .single()
             .execute()
    ).data

    if not rec:
        raise HTTPException(404, detail="Image not found or not clickable")

    record_id = rec["record_id"]

    # 2) record_id -> detail(image array + ref + keywords)
    row = (supabase.table("v_record_detail")
           .select("*")
           .eq("user_id", user_id)
           .eq("record_id", record_id)
           .single()
           .execute()
           ).data
    if not row:
        raise HTTPException(404, detail = "Record not found")
    
    return row

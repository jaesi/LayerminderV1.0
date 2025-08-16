from fastapi import APIRouter, HTTPException, Depends, status
from uuid import UUID
from datetime import datetime, timezone
from typing import List
import uuid

from core.supabase_client import supabase
from auth import get_current_user
from schemas import HistorySession

router = APIRouter(tags=["history"])

# 1. Upload session
@router.post("/history_sessions", response_model=HistorySession)
async def create_session(user_id: str = Depends(get_current_user)):
    session_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    row = {"session_id": session_id, "user_id": user_id, "created_at": created_at}
    resp = supabase.table("history_sessions").insert(row).execute()
    if getattr(resp, "error", None):
        raise HTTPException(status_code=500, detail=f"DB insert failed: {resp.error}")
    return HistorySession(session_id=session_id, user_id=user_id, created_at=created_at)

# 2. Get session
@router.get("/history_sessions", response_model=List[HistorySession])
async def list_sessions(user_id: str = Depends(get_current_user)):
    resp = (
        supabase.table("history_sessions")
        .select("session_id, user_id, created_at")
        .eq("user_id", user_id)
        .order("created_at")
        .execute()
    )
    if getattr(resp, "error", None):
        raise HTTPException(status_code=500, detail=f"DB fetch failed: {resp.error}")
    sessions = resp.data or []
    return [HistorySession(**s) for s in sessions]

# 3. Delete Session
@router.delete(
    "/history_sessions/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_session(
    session_id:str,
    user_id: str = Depends(get_current_user)
):
    # Delete corresponding user_id's row
    resp = (
        supabase.table("history_sessions")
        .delete()
        .eq("session_id", session_id) # same as WHERE id = <session_id>
        .eq("user_id", user_id)
        .execute()
    )
    if getattr(resp, "error", None):
        raise HTTPException(
            status_code=500,
            detail=f"DB delete failed: {resp.error.message}"
        )
    
    # Error 401: no data to delete
    if not resp.data or len(resp.data) == 0:
        raise HTTPException(
            status_code=404,
            detail="Session not found or already deleted"
        )
    
# 4. Get Images from history session
@router.get("/history_sessions/images")
def list_session_images(user_id: str = Depends(get_current_user)):
    try:
        res = (supabase.table("v_record_full")
                .select("*")
                .eq("user_id",user_id)
                .order("created_at")
                .execute()
        )
    except Exception as e:
        raise HTTPException(500, detail = f"Supabase Error: {e}")
    data = res.data or []
    return data
        
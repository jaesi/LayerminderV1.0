from fastapi import APIRouter, HTTPException, Depends
import uuid
from datetime import datetime, timezone
from typing import List

from core.supabase_client import supabase
from auth import get_current_user
from schemas import HistorySession

router = APIRouter(tags=["history"])

# 1. Upload session
@router.post("/history/sessions", response_model=HistorySession)
async def create_session(user_id: str = Depends(get_current_user)):
    session_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    row = {"id": session_id, "user_id": user_id, "created_at": created_at}
    resp = supabase.table("history_sessions").insert(row).execute()
    if getattr(resp, "error", None):
        raise HTTPException(status_code=500, detail=f"DB insert failed: {resp.error}")
    return HistorySession(id=session_id, user_id=user_id, created_at=created_at)

@router.get("/history/sessions", response_model=List[HistorySession])
async def list_sessions(user_id: str = Depends(get_current_user)):
    resp = (
        supabase.table("history_sessions")
        .select("id, user_id, created_at")
        .eq("user_id", user_id)
        .order("created_at")
        .execute()
    )
    if getattr(resp, "error", None):
        raise HTTPException(status_code=500, detail=f"DB fetch failed: {resp.error}")
    sessions = resp.data or []
    return [HistorySession(**s) for s in sessions]

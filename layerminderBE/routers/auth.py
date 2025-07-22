from fastapi import APIRouter, Depends, HTTPException, status
import jwt

from core.config import settings
from core.supabase_client import supabase
from auth import get_current_user
from schemas import ProfileResponse

router = APIRouter(tags=["auth"])

@router.get("/profile", response_model=ProfileResponse)
async def get_profile(user_id: str = Depends(get_current_user)):
    """
    Protected: Authorization Header Supabase Access Token and -> 
    1) get_current_user: Token verification + gets user_id 
    2) Return profile table from Supabase Auth
    """
    try:
        user = supabase.auth.admin.get_user_by_id(user_id)
    except Exception:
        # If get_user_by_id fails
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="User not found.")
    
    return ProfileResponse(
        id=user.user.id,
        email=user.user.email,
        user_metadata=user.user.user_metadata or {}
    )
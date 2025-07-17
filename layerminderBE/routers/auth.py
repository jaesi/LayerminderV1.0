from fastapi import APIRouter, HTTPException
import jwt
from core.config import settings
from core.supabase_client import supabase

router = APIRouter(tags=["auth"])

@router.get("/me")
def get_my_profile(authorization: str = Header(...)):

    # 1) Extract real JWT from Bearer Token
    token = authorization.replace("Bearer ", "")
    
    # 2) JWT decode (supabase JWT)
    try:
        decoded = jwt.decode(token, options={"verify_signature": False})
        user_id = decoded["sub"]
    except Exception as e:
        raise HTTPException(401, "Invalid JWT")
    
    # 3) Supbase Auth users table - search user row
    user_query = supabase.table("auth.users").select("*").eq("id", user_id).execute()
    if not user_query.data:
        raise HTTPException(404, "User not found")
    user_row = user_query.data[0]

    # Get name, pictrue from user_metadata
    meta = user_row.get("user_metadata", {})
    return {
        "id": user_row["id"],
        "email": user_row["email"],
        "provider": user_row["provider"], 
        "name": meta.get("name"),
        "picture": meta.get("picture"),
        "user_metadata": meta,
    }

# push
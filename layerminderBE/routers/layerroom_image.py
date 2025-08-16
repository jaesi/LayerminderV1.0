from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime, timezone
import re
import uuid
from postgrest.exceptions import APIError

from schemas import (
    RoomImageCreate,
    RoomImageOut,
)

from core.supabase_client import supabase
from auth import get_current_user

router = APIRouter(prefix="/layer-rooms-image", tags=["layer-rooms-image"])

def _first_row(res):
    rows = (getattr(res, "data", None) or [])
    return rows[0] if rows else None

@router.post("/{room_id}/images", response_model=RoomImageOut, status_code=status.HTTP_201_CREATED)
def add_image_to_room(
    room_id: uuid.UUID,
    body: RoomImageCreate,
    user_id: str = Depends(get_current_user),
):

    # 1) checking authority
    try:
        room_res = (
            supabase.table("layer_rooms")
            .select("owner_id")
            .eq("id", str(room_id))
            .limit(1)
            .execute()
        )
    except APIError as e:
        raise HTTPException(400, e.message or "Room lookup failed")

    room = _first_row(room_res)
    if not room:
        raise HTTPException(404, "Room not found")
    if room["owner_id"] != user_id:
        raise HTTPException(403, "You do not have permission to add images to this room")

    # 2) Check if image in (url just for response)
    try:
        img_res = (
            supabase.table("images")
            .select("url")
            .eq("image_id", str(body.image_id))
            .limit(1)
            .execute()
        )
    except APIError as e:
        raise HTTPException(400, e.message or "Image lookup failed")

    if not img_res.data:
        raise HTTPException(404, "Image not found")

    now = datetime.now(timezone.utc).isoformat()
    
    
    to_insert = {
        "room_image_id": str(uuid.uuid4()),
        "room_id": str(room_id),
        "image_id": str(body.image_id),
        "note": body.note,
        "seq": body.seq,
        "created_by": user_id,
        "created_at": now,
        "updated_at": now,
    }

    # 3) insert + unique check
    try:
        ins = supabase.table("room_images").insert(to_insert).execute()
    except APIError as e:
        if getattr(e, "code", None) == "23505":  # UNIQUE(room_id, image_id)
            raise HTTPException(409, "Image already pinned in this room")
        raise HTTPException(400, "Insert pin failed: " + e.message )

    row = (ins.data or [None])[0]
    if not row:
        raise HTTPException(500, "Insert pin returned no data")

    # 4) count increment
    try:
        supabase.rpc("increment_pin_count", {"room_id_param": str(room_id)}).execute()
    except APIError:
        pass

    return RoomImageOut(
        room_image_id=row["room_image_id"],
        image_id=row["image_id"],
        url=img_res.data[0]["url"],  # 리스트 접근 수정
        note=row["note"],
        seq=row["seq"],
    )

# List images in a layer Room
@router.get("/{room_id}/images", response_model=List[RoomImageOut])
def list_images_in_room(
    room_id: uuid.UUID, user_id: str = Depends(get_current_user)
):

    # 1) Owner check
    try:
        room_res = (
            supabase.table("layer_rooms")
            .select("owner_id, is_public")
            .eq("id", str(room_id))
            .limit(1)
            .execute()
        )
    except APIError as e:
        raise HTTPException(400, e.message or "Room not found.")
    
    room = _first_row(room_res)
    if not room:
        raise HTTPException(400, "Room not found")
    if not room["is_public"] and room["owner_id"] != user_id:
        raise HTTPException(403, "You do not have permission to view this room's images")

    # 2) List pinned images
    try:
        img_res = (
            supabase.table("room_images")
            .select("room_image_id, image_id, note, seq, images(url)")
            .eq("room_id", str(room_id))
            .order("seq")  # Order by seq
            .execute()
        )
    except APIError as e:
        raise HTTPException(400, "List pins failed: " + e.message)
    
    rows = img_res.data or []
    
    # No images
    if not rows:
        return []

    return [
        RoomImageOut(
            room_image_id=row.get("room_image_id"),
            image_id=row.get("image_id"),
            url=(row.get("images") or {}).get("url"),
            note=row.get("note"),
            seq=row.get("seq"),
        )
        for row in rows
    ]


@router.delete("/{room_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_image_from_room(
    room_id: uuid.UUID,
    image_id: uuid.UUID,
    user_id: str = Depends(get_current_user),
):
    """
    Remove an image from a layer room (unpin).
    """
    # 1) check if 
    try:
        room_res = (
            supabase.table("layer_rooms")
            .select("owner_id")
            .eq("id", str(room_id))
            .maybe_single()
            .execute()
        )
    except APIError as e:
        raise HTTPException(400, e.message or "Room lookup failed")
    
    room = room_res.data
    if not room:
        raise HTTPException(404, "Room not found")
    if room["owner_id"] != user_id:
        raise HTTPException(403, "You do not have permission to remove images from this room")

    # 2) delete
    try:
        del_res = (
            supabase.table("room_images")
            .delete()
            .eq("room_id", str(room_id))
            .eq("image_id", str(image_id))
            .execute()
        )
    except APIError as e:
        raise HTTPException(400, e.message or "Unpin failed")
    
    # 3) Count decrement
    if del_res.data:
        try:
            supabase.rpc("decrement_pin_count", {"room_id_param": str(room_id)}).execute()
        except APIError:
            pass

    return None
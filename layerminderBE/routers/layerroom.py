from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime, timezone
import re
import uuid
from postgrest.exceptions import APIError

from schemas import (
    RoomCreate,
    RoomUpdate,
    RoomOut,
    RoomImageCreate,
    RoomImageOut,
)
from core.supabase_client import supabase
from auth import get_current_user

router = APIRouter(prefix="/layer-rooms", tags=["layer-rooms"])


def simple_slugify(value: str) -> str:
    value = value.lower()
    value = re.sub(r'[^a-z0-9]+', '-', value)  # else(alphabet & number) -> '-'
    return value.strip('-')

def _slug_with_suffix(base: str) -> str:
    return f"{base}-{str(uuid.uuid4())[:4]}"

@router.post("", response_model=RoomOut, status_code=status.HTTP_201_CREATED)
def create_room(body: RoomCreate, 
                user_id: str = Depends(get_current_user)):
    """
    Create a new layer room.
    """
    now = datetime.now(timezone.utc).isoformat()
    base_slug = simple_slugify(body.name)
    slug = base_slug or str(uuid.uuid4())[:8]

    # Check if slug already exists for this user
    existing_room = (
        supabase.table("layer_rooms")
        .select("id")
        .eq("owner_id", user_id)
        .eq("slug", slug)
        .execute()
        .data
        or []
    )
    if existing_room:
        slug = _slug_with_suffix(base_slug)

    room_data = {
        "id": str(uuid.uuid4()),
        "owner_id": user_id,
        "name": body.name,
        "description": body.description,
        "is_public": body.is_public,
        "slug": slug,
        "created_at": now,
        "updated_at": now,
    }

    # Insert into DB
    response = supabase.table("layer_rooms").insert(room_data).execute()
    if getattr(response, "error", None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=response.error.message
        )

    return RoomOut(**response.data[0])


@router.get("", response_model=List[RoomOut])
def list_rooms(
    page: int = 1,       # Seperated in pages to deliever
    size: int = 20,      # How many rows in single page to be?
    mine: bool = True,   # Only mine or else
    q: str = "",         # query keyword
    user_id: str = Depends(get_current_user),
):
    """
    List layer rooms.
    """
    page = max(1, page)
    size = max(1, min(size, 100))
    query = supabase.table("layer_rooms").select("*").is_("archived_at", "null") # picking up alive ones 
    if mine:
        query = query.eq("owner_id", user_id)
    else:
        query = query.eq("is_public", True)

    if q:
        query = query.ilike("name", f"%{q}%")

    offset = (page - 1) * size
    rows = (
        query.range(offset, offset + size - 1)
            .order("created_at", desc=True)
            .execute()
            .data or []
    )
    return [RoomOut(**row) for row in rows]


@router.get("/{room_id}", response_model=RoomOut)
def get_room(room_id: uuid.UUID, user_id: str = Depends(get_current_user)):
    """
    Get a single layer room.
    """
    response = (
        supabase.table("layer_rooms")
        .select("*")
        .eq("id", str(room_id))
        .is_("archived_at", "null")
        .maybe_single()
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Room not found"
        )

    room = response.data
    if not room["is_public"] and room["owner_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this room",
        )

    return RoomOut(**room)


@router.patch("/{room_id}", response_model=RoomOut)
def update_room(
    room_id: uuid.UUID,
    body: RoomUpdate,
    user_id: str = Depends(get_current_user),
):
    """
    Update a layer room.
    """
    # First, verify the user owns the room
    room_response = (
        supabase.table("layer_rooms")
        .select("owner_id")
        .eq("id", str(room_id))
        .maybe_single()
        .execute()
    )
    if not room_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Room not found"
        )
    if room_response.data["owner_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update this room",
        )

    update_data = body.dict(exclude_unset=True)
    if "name" in update_data:
        update_data["slug"] = simple_slugify(update_data["name"])

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update"
        )

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    try:
        res = (
            supabase.table("layer_rooms")
            .update(update_data)
            .eq("id", str(room_id))
            .execute()
        )
    except APIError as e:
        raise HTTPException(
            status_code = status.HTTP_400_BAD_REQUEST,
            detail=e.message or "Supabase update failed"
        )

    row = (res.data or [None])[0]
    if not row:
        raise HTTPException(status_code=404, detail="Room not found or not updated")
    
    return RoomOut(**row)


@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_room(room_id: uuid.UUID, user_id: str = Depends(get_current_user)):
    """
    Delete (archive) a layer room.
    """
    try:
        room_res = (
            supabase.table("layer_rooms")
            .select("owner_id")
            .eq("id", str(room_id))
            .maybe_single()
            .execute()
        )
    except APIError as e:
        raise HTTPException(
            status_code=400,
            detail=e.message or "Room not found."
        )

    if room_res.data["owner_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this room",
        )

    try:
        res = (
            supabase.table("layer_rooms")
            .update({"archived_at": datetime.now(timezone.utc).isoformat()})
            .eq("id", str(room_id))
            .execute()
        )
    except APIError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message or "Supabase delete failed"
        )
    return None



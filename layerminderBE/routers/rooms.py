from fastapi import APIRouter, HTTPException
from schemas import RoomCreate
from typing import List

router = APIRouter()

# 임시 저장용
_rooms = {}

# 방 생성
@router.post("/", status_code=201) # 성공 시, 201 Created 응답
async def create_room(room: RoomCreate):
    room_id = str(len(_rooms) + 1)
    _rooms[room_id] = {"id": room_id, "title": room.title}
    return _rooms[room_id]

# 
@router.get("/")
async def list_rooms():
    return list(_rooms.values())

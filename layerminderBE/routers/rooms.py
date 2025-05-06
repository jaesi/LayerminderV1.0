from fastapi import APIRouter, HTTPException
from typing import List
from schemas import RoomCreate, Room
from db import db
from firebase_admin import firestore


# FastAPI 라우터 생성
router = APIRouter()

# 방 생성
@router.post("/", response_model=Room, status_code=201)
async def create_room(room: RoomCreate):
    # 1) firebase에 추가
    # Firestore SDK에서 컬렉션(테이블)을 참조하는 함수
    # add(), get(), stream() 등의 매서드로 CRUD 작업 수행
    doc_ref = db.collection("rooms").add({ 
        'title': room.title,
        'created_time': firestore.SERVER_TIMESTAMP
    })
    # 2) 추가된 문서 ID 가져오기
    _, ref = doc_ref
    # 3) 실제 저장된 데이터 가져와서 리턴
    created = ref.get().to_dict()
    return Room(id=ref.id, **created)

# 방 정보 조회
@router.get("/", response_model=List[Room])
async def list_rooms():
    rooms = []
    # 1) 컬렉션 조회
    docs = db.collection("rooms").order_by("created_time").stream()
    for doc in docs:
        data = doc.to_dict()
        rooms.append(Room(id=doc.id, **data))
    return rooms

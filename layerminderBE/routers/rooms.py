from fastapi import APIRouter, HTTPException
from typing import List
from schemas import RoomCreate, Room


# FastAPI 라우터 생성
router = APIRouter(tags=["rooms"])

# 방 생성
@router.post("/rooms", response_model=Room, status_code=201)
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
@router.get("/rooms", response_model=List[Room])
async def list_rooms():
    rooms = []
    # 1) 컬렉션 조회
    docs = db.collection("rooms").order_by("created_time").stream()
    for doc in docs:
        data = doc.to_dict()
        rooms.append(Room(id=doc.id, **data))
    return rooms

# 방 정보 수정
@router.patch("/rooms/{room_id}", response_model=Room) # 엔드포인트 반환할 JSON 검증
async def update_room(room_id: str, room: RoomCreate):
    doc_ref = db.collection("rooms").document(room_id)
    if not doc_ref.get().exists:
        raise HTTPException(404, "Room not found")
    doc_ref.update({
        "title": room.title,
        "update_time": firestore.SERVER_TIMESTAMP
    })
    data = doc_ref.get().to_dict()
    return Room(id=room_id, **data)

# 방 정보 삭제
@router.delete("/rooms/{room_id}", status_code=204)
async def delete_room(room_id: str):
    doc_ref = db.collection("rooms").document(room_id) # rooms 컬렉션 내 ID가 'room_id'인 문서 참조
    if not doc_ref.get().exists:
        raise HTTPException(404, "Room not found")
    doc_ref.delete()
    return
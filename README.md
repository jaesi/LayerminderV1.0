# LayerminderV1.0

| 경로             | 역할                                                                                                    |
|------------------|---------------------------------------------------------------------------------------------------------|
| **main.py**      | FastAPI 앱의 **진입점(entrypoint)**<br>애플리케이션 생성, 라우터(모듈) 연결, 서버 설정 등이 여기서 시작됨 |
| **schemas.py**    | **Pydantic** 모델 정의 파일<br>요청(Request)·응답(Response) 데이터 스키마, DB 스키마(ORM) 클래스 등 선언    |
| **routers/**     | **라우터 모듈** 모아두는 디렉토리<br>엔드포인트별로 파일 분리해 관리 → 코드 가독성·유지보수성 ↑            |
| **routers/rooms.py** | `rooms` 관련 **라우터 + 핸들러** 정의<br>`GET /rooms`, `POST /rooms`, `PATCH /rooms/{id}` 등 CRUD 구현 예정 |


# 설정해야할 리스트
1. layerminderBE/ 위치에 serviceAccountKey.json 복사 
- firebase 콘솔에서 발급받기
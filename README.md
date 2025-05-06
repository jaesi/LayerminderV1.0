# LayerminderV1.0

# 전체 폴더 구성
LayerMinderV1.0/ <br>
├── layerminderBE/ # 백엔드(FastAPI) 코드<br> │ ├── init.py # 패키지 인식용 파일 <br>
│ ├── db.py # Firestore 초기화 <br>
│ ├── run.py # FastAPI 앱 진입점 <br>
│ ├── routers/ # API 라우터 모듈 <br>
│ │ └── rooms.py # layerroom 관련 함수 정의 <br>
│ ├── schemas.py # Pydantic 모델 정의 <br>
│ └── (serviceAccountKey.json) # Firebase 서비스 계정 키 <br>
│ └── layerminderFE/ # 프론트엔드(템플릿/가이드)<br>
│ ├── .gitignore  <br>
├── poetry.lock # Poetry 잠금 파일 <br>
├── pyproject.toml # Poetry 설정 파일 <br>
└── README.md 

| 경로             | 역할                                                                                                    |
|------------------|---------------------------------------------------------------------------------------------------------|
| **run.py**      | FastAPI 앱의 **진입점(entrypoint)**<br>애플리케이션 생성, 라우터(모듈) 연결, 서버 설정 등이 여기서 시작됨 |
| **schemas.py**    | **Pydantic** 모델 정의 파일<br>요청(Request)·응답(Response) 데이터 스키마, DB 스키마(ORM) 클래스 등 선언    |
| **routers/**     | **라우터 모듈** 모아두는 디렉토리<br>엔드포인트별로 파일 분리해 관리 → 코드 가독성·유지보수성 ↑            |
| **routers/rooms.py** | `rooms` 관련 **라우터 + 핸들러** 정의<br>`GET /rooms`, `POST /rooms`, `PATCH /rooms/{id}` 등 CRUD 구현 예정 |


# 설정해야할 리스트
### 1. layerminderBE/ 위치에 serviceAccountKey.json 복사 
- firebase 콘솔에서 발급받기

### 2. python 라이브러리 관리
- poetry 설치
    - (설치 방법 추가하겠습니다.)
    - 터미널 상에서 poetry --version 할 시 나오면 성공
- poetry install을 통해 간단 설치
* 추후 라이브러리 추가 시 lock 파일이 업데이트 되고 그에 따라 install을 해주면 추가 반영 바로 됨
# LayerMinder V1.0

AI 기반 가구 디자인 생성 및 추천 플랫폼

## 프로젝트 개요

LayerMinder는 사용자가 업로드한 이미지들을 OpenAI의 AI 모델로 합성하여 새로운 가구 디자인을 생성하고, CLIP 모델과 FAISS 벡터 검색을 통해 유사한 레퍼런스 이미지를 추천하는 플랫폼입니다.

### 핵심 기능

1. **AI 이미지 합성**: 여러 이미지를 하나의 가구 디자인으로 합성
2. **스토리 자동 생성**: 생성된 가구에 대한 문화적/감성적 설명 생성
3. **키워드 추출**: 디자인 스타일, 형태, 소재 기반 키워드 자동 추출
4. **유사 이미지 추천**: CLIP 임베딩 기반 레퍼런스 이미지 검색
5. **크레딧 시스템**: 사용량 기반 크레딧 관리

---

## 기술 스택

### Backend
- **프레임워크**: FastAPI 0.115+
- **언어**: Python 3.11+
- **패키지 관리**: Poetry
- **주요 라이브러리**:
  - `openai`: GPT 모델 API
  - `transformers`: CLIP 모델
  - `faiss-cpu`: 벡터 유사도 검색
  - `torch`: 딥러닝 모델 실행
  - `supabase`: DB 및 스토리지
  - `sqlalchemy`: ORM
  - `pydantic`: 데이터 검증

### Frontend
- **프레임워크**: Next.js 15.3
- **언어**: TypeScript
- **주요 라이브러리**:
  - `react` 19.0
  - `@supabase/supabase-js`: Supabase 클라이언트
  - `tailwindcss` 4: 스타일링
  - `lucide-react`: 아이콘

### Infrastructure
- **데이터베이스**: Supabase (PostgreSQL)
- **스토리지**: Supabase Storage
- **인증**: JWT Bearer Token
- **컨테이너**: Docker

---

## 디렉토리 구조

```
LayerminderV1.0/
├── layerminderBE/              # 백엔드 (FastAPI)
│   ├── run.py                  # 앱 진입점
│   ├── auth.py                 # JWT 인증
│   ├── schemas.py              # Pydantic 스키마
│   │
│   ├── core/                   # 핵심 설정
│   │   ├── config.py           # 환경변수 설정
│   │   └── supabase_client.py  # Supabase 클라이언트
│   │
│   ├── routers/                # API 엔드포인트
│   │   ├── auth.py             # 인증
│   │   ├── generation.py       # AI 이미지 생성
│   │   ├── streaming.py        # 실시간 상태 스트리밍
│   │   ├── history.py          # 생성 히스토리
│   │   ├── layerroom.py        # 세션 관리
│   │   ├── layerroom_image.py  # 세션 이미지
│   │   ├── image_view.py       # 이미지 조회
│   │   ├── image_metadata.py   # 이미지 메타데이터
│   │   └── credits.py          # 크레딧 관리
│   │
│   ├── services/               # 비즈니스 로직
│   │   ├── pipeline.py         # 전체 AI 파이프라인
│   │   ├── image_generation.py # OpenAI 이미지 생성
│   │   ├── story_keyword_generation.py  # GPT 스토리/키워드
│   │   ├── recommendation.py   # CLIP + FAISS 추천
│   │   └── credit.py           # 크레딧 서비스
│   │
│   ├── batch/                  # 배치 작업
│   │   ├── embeddings/         # FAISS 인덱스 & 메타데이터
│   │   └── embedding_from_storage.py  # 임베딩 생성
│   │
│   ├── repositories/           # DB 레포지토리
│   └── supabase/               # Supabase 마이그레이션
│
├── layerminderFE/              # 프론트엔드 (Next.js)
│   └── frontend/
│       ├── src/
│       │   ├── app/            # Next.js 앱 라우터
│       │   └── components/     # React 컴포넌트
│       └── package.json
│
├── pyproject.toml              # Poetry 의존성
├── Dockerfile                  # 프로덕션 Docker
├── Dockerfile.dev              # 개발용 Docker
└── docker-compose.dev.yml      # Docker Compose
```

---

## AI 파이프라인 구조

LayerMinder의 핵심은 3단계 AI 파이프라인입니다.

### 1. 이미지 생성 (OpenAI GPT-Image-1)

**처리 흐름**:
```
사용자 이미지 업로드 (2~4장)
    ↓
Supabase Storage에 저장
    ↓
OpenAI GPT-Image-1 API 호출
    ↓
4개의 합성 이미지 생성 (1024x1024 JPEG)
    ↓
생성된 이미지 저장 및 DB 매핑
```

**구현 위치**: `layerminderBE/services/image_generation.py`

**핵심 코드**:
```python
# OpenAI 이미지 합성 API 호출
result = await client.images.edit(
    model="gpt-image-1",
    image=file_objs,  # 여러 이미지 입력
    prompt=f'''
    Combine these two image into one thing that one can sit on.
    Details should be minimalistic and {keyword}(0.8), with a clean aesthetic.
    Take the key design concepts from the given image.
    ''',
    quality="low",
    size="1024x1024",
    output_format="jpeg",
    output_compression=50,
    n=4  # 4개 생성
)
```

**특징**:
- 다중 이미지를 하나의 가구 디자인으로 합성
- 사용자 키워드 반영 (예: "modern", "classic")
- 비동기 처리로 백그라운드에서 실행

---

### 2. 스토리 & 키워드 생성 (OpenAI GPT-4.1-nano)

**처리 흐름**:
```
생성된 이미지 선택
    ↓
이미지를 Base64로 인코딩
    ↓
GPT-4.1-nano에 Vision API 호출
    ↓
문화적/감성적 스토리 생성 + 12개 키워드 추출
    ↓
DB에 저장 (story, keywords 컬럼)
```

**구현 위치**: `layerminderBE/services/story_keyword_generation.py`

**핵심 프롬프트 전략**:
```python
system_message = """
You are a specialist in writing elegant and culturally-informed
product descriptions for furniture collections.
"""

user_prompt = """
Analyze the furniture shown in the image and generate:

Name: <concise name including object type>
Dimensions: Width, Depth, Height in cm
Material: <realistic materials like oak, steel, marble>

Title: "<expressive title capturing cultural/emotional inspiration>"

Story: Two refined paragraphs
- Paragraph 1: Cultural/environmental inspiration
- Paragraph 2: Symbolic/functional design elements

Keywords: Extract exactly 12 single-word English keywords
- Style (minimal, modern, etc.)
- Geometric form (curved, angular, layered, etc.)
- Materials (velvet, walnut, brushed, etc.)
"""
```

**출력 예시**:
```
Name: Nordic Oak Table
Dimensions: Width: 180 cm, Depth: 90 cm, Height: 75 cm
Material: Solid oak wood, brushed steel legs

Title: "Scandinavian Simplicity Meets Organic Form"

Story: Inspired by the minimalist traditions of Nordic design...

Keywords: minimal, oak, rectangular, brushed, scandinavian,
          natural, clean, simple, wooden, steel, modern, organic
```

---

### 3. 유사 이미지 추천 (CLIP + FAISS)

**처리 흐름**:
```
생성된 4개 이미지 로드
    ↓
CLIP 모델로 각 이미지 임베딩 생성 (512차원 벡터)
    ↓
평균 벡터 계산 (4개 이미지의 평균)
    ↓
FAISS 인덱스에서 코사인 유사도 검색
    ↓
가장 유사한 레퍼런스 이미지 1개 추천
```

**구현 위치**: `layerminderBE/services/recommendation.py`

**핵심 기술**:

#### CLIP 임베딩 생성
```python
from transformers import CLIPModel, AutoImageProcessor

# CLIP 모델 로드 (최초 1회)
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = AutoImageProcessor.from_pretrained("openai/clip-vit-base-patch32")

# 이미지 → 512차원 벡터
def get_image_embedding(url: str) -> np.ndarray:
    img = Image.open(BytesIO(requests.get(url).content))
    inputs = processor(images=img, return_tensors="pt")

    with torch.no_grad():
        features = model.get_image_features(**inputs)
        features = features / features.norm(dim=-1, keepdim=True)  # 정규화

    return features.cpu().numpy()[0]  # (512,) shape
```

#### FAISS 벡터 검색
```python
# 여러 이미지의 평균 벡터 계산
features = [get_image_embedding(url) for url in urls]
mean_vec = np.mean(np.stack(features), axis=0, keepdims=True)

# FAISS 인덱스에서 가장 유사한 이미지 검색
faiss_index = faiss.read_index("batch/embeddings/image_embeddings.index")
D, I = faiss_index.search(mean_vec, top_k=1)

best_idx = I[0][0]  # 가장 유사한 인덱스
recommendation = metadata[best_idx]
```

**FAISS 인덱스 구조**:
- `batch/embeddings/image_embeddings.index`: 벡터 인덱스
- `batch/embeddings/image_embeddings_metadata.csv`: 이미지 URL 및 ID 메타데이터

**사전 구축 방법** (`batch/embedding_from_storage.py`):
1. Supabase Storage의 레퍼런스 이미지 로드
2. 각 이미지를 CLIP으로 임베딩
3. FAISS IndexFlatIP (Inner Product) 인덱스 생성
4. 메타데이터 CSV 파일 생성

---

## GPT AI 활용 요약

| 모델 | 용도 | 입력 | 출력 | API |
|------|------|------|------|-----|
| **GPT-Image-1** | 이미지 합성 | 2~4개 이미지 + 텍스트 프롬프트 | 4개의 1024x1024 JPEG | `openai.images.edit()` |
| **GPT-4.1-nano** | 스토리/키워드 생성 | 이미지 1개 (Base64) + 시스템/유저 프롬프트 | 2단락 스토리 + 12개 키워드 | `openai.chat.completions.create()` |
| **CLIP (openai/vit-base-patch32)** | 이미지 임베딩 | 이미지 URL | 512차원 벡터 | `transformers.CLIPModel` |

### AI 비용 최적화
- **GPT-Image-1**: `quality="low"`, `output_compression=50`
- **GPT-4.1-nano**: 경량 모델 사용 (GPT-4 대비 저비용)
- **CLIP**: 로컬 실행 (API 비용 없음)

---

## API 파이프라인 구조

### 전체 생성 프로세스 (`services/pipeline.py`)

```python
async def full_pipeline(record_id, input_image_keys, keyword, user_id):
    # 1단계: 이미지 생성 (GPT-Image-1)
    await generate_and_store_images(
        record_id,
        input_image_keys,
        user_id,
        keyword
    )
    # → status: "processing" → "ready" or "error"

    # 2단계: 스토리/키워드 생성 (GPT-4.1-nano)
    await generate_and_store_story_keywords(record_id)
    # → story_status, keywords_status: "processing" → "ready" or "error"

    # 3단계: 유사 이미지 추천 (CLIP + FAISS)
    rec = await asyncio.to_thread(recommend_image, image_urls, 1)
    # → recommendation_status: "processing" → "ready" or "failed"
```

### 실시간 상태 업데이트 (SSE)

**엔드포인트**: `GET /api/v1/records/{record_id}/stream`

**클라이언트 수신 예시**:
```json
// 이미지 생성 중
{"image_status": "processing"}

// 이미지 생성 완료
{"image_status": "ready", "image_urls": ["...", "...", "...", "..."]}

// 스토리 생성 완료
{"story_status": "ready", "story": "...", "keywords": ["modern", "oak", ...]}

// 추천 완료
{"recommendation_status": "ready", "reference_image_url": "..."}
```

---

## 주요 API 엔드포인트

### 인증
- `POST /api/v1/auth/signup` - 회원가입
- `POST /api/v1/auth/login` - 로그인 (JWT 토큰 발급)

### 이미지 생성
- `POST /api/v1/generate` - AI 이미지 생성 시작 (백그라운드 처리)
  - **요청**: `session_id`, `input_image_keys[]`, `keyword?`
  - **응답**: `record_id`, `image_status: "pending"`

- `GET /api/v1/records/{record_id}/stream` - 실시간 상태 스트리밍 (SSE)

### 히스토리
- `GET /api/v1/sessions/{session_id}/records` - 세션별 생성 기록
- `GET /api/v1/records/{record_id}` - 특정 기록 상세

### 크레딧
- `GET /api/v1/credits` - 사용자 크레딧 조회
- `POST /api/v1/credits/add` - 크레딧 추가

### LayerRoom (세션 관리)
- `POST /api/v1/layerroom` - 새 세션 생성
- `GET /api/v1/layerroom/{session_id}` - 세션 조회
- `POST /api/v1/layerroom/{session_id}/images` - 입력 이미지 업로드

---

## 환경 설정

### 1. 환경 변수 설정

`.env` 파일 생성:
```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=layerminder
REFERENCE_STORAGE_BUCKET=reference

# OpenAI
OPENAI_API_KEY=sk-...

# JWT
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256

# Database
DATABASE_URL=postgresql://...
```

### 2. Backend 설치 및 실행

```bash
# Poetry를 통한 의존성 설치
cd layerminderBE
poetry install

# 개발 서버 실행
poetry run python run.py
# → http://localhost:8000
```

### 3. Frontend 설치 및 실행

```bash
cd layerminderFE/frontend
npm install

# 개발 서버 실행 (포트 7777)
npm run dev
# → http://localhost:7777
```

### 4. Docker로 실행

```bash
# 개발 환경
docker-compose -f docker-compose.dev.yml up

# 프로덕션 빌드
docker build -t layerminder-be .
docker run -p 8000:8000 layerminder-be
```

---

## FAISS 인덱스 생성 (관리자용)

레퍼런스 이미지 DB 구축:

```bash
cd layerminderBE

# Supabase Storage의 레퍼런스 이미지를 임베딩
poetry run python -m batch.embedding_from_storage

# 생성 결과:
# - batch/embeddings/image_embeddings.index
# - batch/embeddings/image_embeddings_metadata.csv
```

---

## 데이터베이스 스키마

### history_records
```sql
- record_id: UUID (PK)
- session_id: UUID (FK)
- image_status: TEXT (pending/processing/ready/error)
- story_status: TEXT (pending/processing/ready/error)
- keywords_status: TEXT (pending/processing/ready/error)
- recommendation_status: TEXT (pending/processing/ready/failed)
- story: TEXT
- keywords: TEXT[]
- reference_image_id: UUID (FK)
- created_at, updated_at: TIMESTAMP
```

### images
```sql
- image_id: UUID (PK)
- user_id: UUID (FK)
- url: TEXT
- type: TEXT (uploaded/generated)
- created_at: TIMESTAMP
```

### user_credits
```sql
- user_id: UUID (PK, FK)
- credits: INTEGER
- last_updated: TIMESTAMP
```

---

## 크레딧 시스템

### 소비 정책
- **이미지 생성**: 1 크레딧 소비
- 크레딧 부족 시 `402 Payment Required` 반환

### 동시성 제어
- DB 트랜잭션으로 race condition 방지
- 크레딧 확인 → 소비 → 생성 순서 보장

---

## 개발 노트

### 성능 최적화
1. **CLIP/FAISS 모델 캐싱**: 최초 1회만 로드
2. **비동기 이미지 생성**: BackgroundTasks 활용
3. **SSE 스트리밍**: 실시간 상태 업데이트로 UX 개선

### 에러 핸들링
- 각 파이프라인 단계별 독립적 에러 처리
- 실패 시 해당 단계만 `error` 상태 설정
- 다음 단계 실행 중단으로 불필요한 API 비용 절감

### 보안
- JWT Bearer 인증
- Supabase RLS (Row Level Security) 활용
- 환경 변수를 통한 시크릿 관리

---

## 라이센스

본 프로젝트의 라이센스는 별도로 명시되지 않았습니다.

---

## 기여

문의 사항은 [answotlr54@gmail.com](mailto:answotlr54@gmail.com)으로 연락 바랍니다.

from fastapi import FastAPI, HTTPException
from sqlalchemy.orm import Session
from db import SessionLocal
from models import Image 
from schemas import ImageGenerationRequest, GeneratedImageResponse, ImageGenerationResponse

router = FastAPI(tags=['AI'])

def call_stability_ai(input_image_id: str, keyword: Optional[str]) -> List[dict]:
    # 실제로는 Stability AI API 호출해서 결과 받아야 함!
    # 여기선 임의 결과로 모킹
    return [{
        "imageId": f"stability_{input_image_id}_1",
        "s3url": f"https://s3.../generated/stability_{input_image_id}_1.jpg"
    }]

def call_openai_api(input_image_ids: List[str], keyword: Optional[str]) -> List[dict]:
    # 실제로는 OpenAI API 호출해서 결과 받아야 함!
    # 여기선 임의 결과로 모킹
    return [{
        "imageId": f"openai_{input_image_ids[0]}_{input_image_ids[1]}_1",
        "s3url": f"https://s3.../generated/openai_{input_image_ids[0]}_{input_image_ids[1]}_1.jpg"
    }]

@router.post("/generate", response_model=ImageGenerationResponse)
def generate_images(req: ImageGenerationRequest):
    # 1. 입력 검증
    if not req.inputImageIds or len(req.inputImageIds) == 0:
        raise HTTPException(400, "inputImageIds는 최소 1개 필요")
    if len(req.inputImageIds) > 2:
        raise HTTPException(400, "inputImageIds는 최대 2개까지만 가능")

    # 2. 분기 처리
    if len(req.inputImageIds) == 1:
        # Stability AI 사용
        result = call_stability_ai(req.inputImageIds[0], req.keyword)
    else:
        # 2개면 OpenAI 사용
        result = call_openai_api(req.inputImageIds, req.keyword)

    # 3. 응답 포맷
    generated_images = [GeneratedImageResponse(**img) for img in result]
    return ImageGenerationResponse(generatedImages=generated_images)

from fastapi import APIRouter, HTTPException, Depends
from auth import get_current_user
from schemas import ImageGenerationRequest, ImageGenerationResponse
from services.image_generation import generate_and_store_db

import asyncio

router = APIRouter(tags=['AI'])

@router.post("/generate", response_model=ImageGenerationResponse)
async def generate_images(
    req: ImageGenerationRequest,
    user_id: str=Depends(get_current_user)
):
    # 입력 검증
    if not req.input_image_keys or len(req.input_image_keys) == 0:
        raise HTTPException(400, "input image_keys are required")
    if len(req.input_image_keys) > 2:
        raise HTTPException(400, "max 2 image_keys are allowed")

    # async x4 generation
    tasks = [generate_and_store_db(
        image_keys=req.input_image_keys,
        keyword=req.keyword,
        user_id = user_id
    ) for _ in range(4)]
    results = await asyncio.gather(*tasks)

    # Extracting image_key, url from outputs
    output_image_keys = [r["image_key"] for r in results]
    output_urls = [r["url"] for r in results]

    return ImageGenerationResponse(
        image_keys=output_image_keys,
        urls=output_urls) 


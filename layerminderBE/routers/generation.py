from fastapi import FastAPI, HTTPException
from sqlalchemy.orm import Session
from db import SessionLocal
from models import Image 
from schemas import GenerateImageRequest, GenerateImageResponse, GeneratedImageResponse

app = FastAPI()

@app.post("/api/v1/images/generate", response_model=GenerateImageResponse)
def generate_image(req: GenerateImageRequest):
    db: Session = SessionLocal()
    # 1. inputImageId로 원본 S3 URL 찾기
    input_img = db.query(Image).filter(Image.id == req.inputImageId).first()
    if not input_img:
        raise HTTPException(status_code=404, detail="Input image not found")
    
    # 2. (여기서 AI 이미지 생성 로직 필요 - 예시는 임의의 s3url 생성)
    # 실제론 AI 서버 연동, 생성 후 S3 업로드 및 URL 획득
    
    # 3. 생성 결과(여러 장)를 DB에 저장
    result_list = []
    for i in range(2):   # 예시로 2장
        new_img = Image(
            user_id=req.userId,
            type="generated",
            s3url=f"https://s3.../generated/{req.userId}/image_{i}.jpg",
            file_key=f"generated/{req.userId}/image_{i}.jpg",
            origin="generate",
            meta={"from": req.inputImageId, "keywords": req.keywords},
        )
        db.add(new_img)
        db.commit()
        db.refresh(new_img)
        result_list.append(GeneratedImageResponse(imageId=str(new_img.id), s3url=new_img.s3url))
    db.close()
    return GenerateImageResponse(generatedImages=result_list)

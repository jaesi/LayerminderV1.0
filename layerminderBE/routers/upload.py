# presigned URL 발급용 API

from fastapi import APIRouter
from pydantic import BaseModel
import boto3
import uuid
import os

router = APIRouter(tags=["upload"])

class PresignedUrlRequest(BaseModel):
    userId: str
    fileType: str

class PresignedUrlResponse(BaseModel):
    uploadUrl: str
    fileKey: str
    expiresIn: int

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
S3_BUCKET_NAME = "layerminder"
REGION_NAME = "ap-northeast-2"

s3_client = boto3.client(
    "s3",
    region_name=REGION_NAME,
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
)

@router.post("/upload-url", response_model=PresignedUrlResponse)
def get_presigned_url(req: PresignedUrlRequest):
    # checking for the super User
    if not req.user_id:
        raise HTTPException(status_code=400, detail="user_id is required")

    file_ext = req.fileType.split('/')[-1]
    file_key = f"user-uploads/{req.userId}/{uuid.uuid4()}.{file_ext}"
    expires_in = 600  # 10min setting

    upload_url = s3_client.generate_presigned_url(
        ClientMethod="put_object",
        Params={
            "Bucket": S3_BUCKET_NAME,
            "Key": file_key,
            "ContentType": req.fileType
        },
        ExpiresIn=expires_in,
    )

    return PresignedUrlResponse(
        uploadUrl=upload_url,
        fileKey=file_key,
        expiresIn=expires_in
    )
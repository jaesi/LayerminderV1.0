import os 
import base64
import uuid
import requests
from openai import OpenAI
import boto3

# env setting
OPENAI_APIKEY = os.getenv("OPENAI_API_KEY")
S3_BUCKET = os.getenv("S3_BUCKET_NAME")
S3_REGION = os.getenv("S3_REGION")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")

# S3 client create
s3 = boto3.client(
    "s3",
    region_name = S3_REGION,
    aws_access_key_id = AWS_ACCESS_KEY_ID,
    aws_secret_access_key = AWS_SECRET_ACCESS_KEY
)

client = OpenAI()

# s3 -> base64
def s3url_to_base64(s3url: str)->str:
    response = requests.get(s3url)
    response.raise_for_statis()
    return base64.b64encode(response.content).decode("utf-8")

# base64 -> upload to S3
def upload_base64_to_s3(base64_data:str, file_key:str)->str:
    img_bytes = base64.b64decode(base64_data)
    s3.put_object(
        Bucket = S3_BUCKET,
        Key=file_key,
        Body=img_bytes,
        ContentType="image/png",
        ACL="public-read",
    )
    return f"https://layerminder.s3.ap-northeast-2.amazonaws.com/{file_key}"

# openai api 
def openai_generate_image(
    prompt: str,
    s3_image_urls: list,
    user_id: str
) -> dict:
    """
    - prompt: 생성할 이미지 설명 프롬프트
    - s3_image_urls: 레퍼런스 이미지의 s3url 리스트 (최대 2개)
    - user_id: 유저 id (경로 지정용)
    """
    # 1. S3 이미지를 base64로 변환
    base64_images = [s3url_to_base64(url) for url in s3_image_urls]

    # 2. OpenAI API input 구성 (텍스트+이미지)
    input_content = [
        {"type": "input_text", "text": prompt}
    ]
    for b64 in base64_images:
        input_content.append({
            "type": "input_image",
            "image_url": f"data:image/png;base64,{b64}"
        })

    # 3. OpenAI API 호출
    response = client.responses.create(
        model="gpt-4.1",
        input=[
            {
                "role": "user",
                "content": input_content
            }
        ],
        tools=[{"type": "image_generation"}],
    )

    # 4. 결과에서 생성 이미지(base64) 추출
    image_generation_calls = [
        output for output in response.output
        if output.type == "image_generation_call"
    ]
    if not image_generation_calls:
        raise Exception("이미지 생성 실패")

    image_base64 = image_generation_calls[0].result

    # 5. 결과 이미지를 S3에 업로드
    file_key = f"generated/{user_id}/{uuid.uuid4()}.png"
    s3url = upload_base64_to_s3(image_base64, file_key)

    # 6. (DB 등록 필요시 이 시점에서 수행)
    # imageId = DB 등록 로직
    imageId = str(uuid.uuid4())  # 예시

    return {
        "imageId": imageId,
        "s3url": s3url
    }

# === 사용 예시 ===
if __name__ == "__main__":
    # 테스트용 샘플
    prompt = "Generate a photorealistic modern chair."
    s3_image_urls = [
        "https://layerminder.s3.region.amazonaws.com/user-uploads/xxx/image1.png",
        "https://layerminder.s3.region.amazonaws.com/user-uploads/xxx/image2.png",
    ]
    user_id = "super-user-id"
    result = openai_generate_image(prompt, s3_image_urls, user_id)
    print(result)


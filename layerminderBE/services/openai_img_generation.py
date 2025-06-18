import os
import base64
import uuid
import requests
from io import BytesIO
from openai import OpenAI
from supabase import create_client
from dotenv import load_dotenv

# 1. .env 로드
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE")  # 서버사이드용
STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET")  # ex. "images"


# 2. Supabase 클라이언트
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
client    = OpenAI()

# 3. file_key → presigned URL → base64
def storage_to_base64(file_key: str, expires_in: int = 600) -> str:
    # presigned URL 발급
    signed = supabase.storage.from_(STORAGE_BUCKET) \
                    .create_signed_url(file_key, expires_in)
    url = signed["signedUrl"]
    # 다운로드
    resp = requests.get(url)
    resp.raise_for_status()
    # base64로 인코딩
    return base64.b64encode(resp.content).decode("utf-8")

# 4. base64 → Supabase Storage 업로드 → public URL 리턴
def upload_base64_to_storage(base64_data: str, file_key: str) -> str:
    img_bytes = base64.b64decode(base64_data)
    bio = BytesIO(img_bytes)
    bio.name = os.path.basename(file_key)
    # 업로드
    res = supabase.storage.from_(STORAGE_BUCKET).upload(file_key, bio)
    if res.get("error"):
        raise Exception("Upload failed: " + str(res["error"]))
    # publicUrl 조회 (public bucket인 경우)
    url = supabase.storage.from_(STORAGE_BUCKET).get_public_url(file_key)
    return url["publicUrl"]

# 5. OpenAI → 생성 → Supabase 업로드 전체 플로우
def openai_generate_image(prompt: str, file_keys: list, user_id: str) -> dict:
    # 1) 레퍼런스 이미지들 base64로
    b64_images = [storage_to_base64(k) for k in file_keys]
    # 2) OpenAI input 구성
    input_content = [{"type": "input_text", "text": prompt}]
    for b64 in b64_images:
        input_content.append({
            "type": "input_image",
            "image_url": f"data:image/png;base64,{b64}"
        })
    # 3) OpenAI 호출
    response = client.responses.create(
        model="gpt-4.1",
        input=[{"role": "user", "content": input_content}],
        tools=[{"type": "image_generation"}],
    )
    calls = [o for o in response.output if o.type=="image_generation_call"]
    if not calls:
        raise Exception("이미지 생성 실패")
    generated_b64 = calls[0].result

    # 4) 결과 업로드
    out_key = f"generated/{user_id}/{uuid.uuid4()}.png"
    s3url = upload_base64_to_storage(generated_b64, out_key)

    # 5) DB 등록 시점 → imageId 발급 (예시)
    image_id = str(uuid.uuid4())

    return {"image_id": image_id, "s3url": s3url}


# === 사용 예시 ===
if __name__ == "__main__":
    prompt = "Generate a photorealistic modern chair."
    refs   = ["1000001328_main_061.png","sofa_sky_prof.png"]  # Supabase Storage file_keys
    uid    = "63423524-f1bc-4a01-891f-1314b7634189"
    result = openai_generate_image(prompt, refs, uid)
    print(result)

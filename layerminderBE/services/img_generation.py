import os
import base64
import uuid
import requests
from io import BytesIO
import asyncio

from openai import OpenAI, AsyncOpenAI
from supabase import create_client
from dotenv import load_dotenv


from datetime import datetime

# 1. .env 로드
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE")  # 서버사이드용
STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET")  # ex. "images"

# 2. Supabase & OpenAI 클라이언트
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
client = AsyncOpenAI()

# 3. Supabase storage making it to fileobject
def supabase_image_to_fileobject(supabase, storage_bucket, file_key, expires_in=600) -> base64:
    signed = supabase.storage.from_(storage_bucket).create_signed_url(file_key, expires_in)
    url = signed["signedUrl"]
    resp = requests.get(url)
    resp.raise_for_status()
    img_bytes = resp.content
    file_object = BytesIO(img_bytes)
    file_object.name = os.path.basename(file_key)
    return file_object

# 4. base64 -> openAI gpt-image-1 API
async def openai_img_2_img(file_objs, input_prompt="Combine two image into one furniture."):
    # error message
    if not file_objs:
        raise ValueError("You need minimum 1 image to proceed Layerminder.")
    
    result = await client.images.edit(
        model = 'gpt-image-1',
        image = file_objs,
        prompt = input_prompt,
        quality = 'low',
        size = '1024x1024',
        output_format = 'jpeg',
        output_compression = 50
    )
    
    image_base64 = result.data[0].b64_json
    image_bytes = base64.b64decode(image_base64)
    
    # unique file name
    unique_id = uuid.uuid4().hex
    filename = f"{unique_id}.jpeg"

    # Save the image
    with open(f"gen_test/{input_prompt[:10]}_{filename}", "wb") as f:
        f.write(image_bytes)
    print(f"image generated")
    

### test riding

async def main():
    img_keys = ["1000001328_main_061.png", "sofa_sky_prof.png"]
    prompt = "Modern sofa with a studio background"

    file_objs = [supabase_image_to_fileobject(supabase, STORAGE_BUCKET, k) for k in img_keys]
    print(file_objs)

    # async mode for creating 4 in a time 
    tasks = [openai_img_2_img(file_objs, prompt) for _ in range(4)]
    await asyncio.gather(*tasks)

if __name__ == "__main__":
    asyncio.run(main())
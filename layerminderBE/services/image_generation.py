import os
import base64
import uuid
import requests
from io import BytesIO
import asyncio
from datetime import datetime, timezone
from openai import OpenAI, AsyncOpenAI

from core.supabase_client import supabase
from core.config import settings

# 1. load env variables
STORAGE_BUCKET = settings.STORAGE_BUCKET
OPENAI_API_KEY = settings.OPENAI_API_KEY

# 2. Supabase & OpenAI 클라이언트
client = AsyncOpenAI()

# 3. Supabase storage making it to fileobject
def supabase_image_to_fileobject(file_key, expires_in=600) -> base64:
    signed = supabase.storage.from_(STORAGE_BUCKET).create_signed_url(file_key, expires_in)
    url = signed["signedUrl"]
    resp = requests.get(url)
    resp.raise_for_status()
    img_bytes = resp.content
    file_object = BytesIO(img_bytes)
    file_object.name = os.path.basename(file_key)
    return file_object

# 4. base64 -> openAI gpt-image-1 API
async def generate_and_store_db(image_keys, 
                           keyword: str = "modern", # default
                           user_id = None):
    # error message
    if not image_keys:
        raise ValueError("You need minimum 1 image to proceed Layerminder.")
    
    # 1. Making it to file object(From Supabase)
    file_objs = [supabase_image_to_fileobject(key) for key in image_keys]
    
    # 2. Openai API -> result: base64
    result = await client.images.edit(
        model = 'gpt-image-1',
        image = file_objs,
        prompt = f"Combine two image into one furniture in {keyword} style.",
        quality = 'low',
        size = '1024x1024',
        output_format = 'jpeg',
        output_compression = 50
    )
    # 2.1. base64 -> bytes
    image_bytes = base64.b64decode(result.data[0].b64_json)
    
    # 3. Upload to the supbase storage
    generated_image_key = f"generated/{uuid.uuid4().hex}.jpeg"
    supabase.storage.from_(STORAGE_BUCKET).upload(generated_image_key,BytesIO(image_bytes))

    # 4. Making Public URL
    public_url = supabase.storage.from_(STORAGE_BUCKET).get_public_url(generated_image_key)["publicUrl"] 
    
    # 5. Store to DB
    images_row = {
        "id": str(uuid.uuid4()),
        "user_id" : user_id,
        "type" : "generated",
        "file_key" : generated_image_key,
        "meta" : {"keyword": keyword},
        "created_at" : datetime.now(timezone.utc).isoformat(),
        "url" : public_url
    }
    # insert
    resp = supabase.table("images").insert(images_row).execute()
    # error handling
    if getattr(resp, "error", None):
        raise Exception(f"DB Load failed: {resp.error}")

    # 6. Ruturn output
    return {
        "image_key": generated_image_key,
        "url": public_url
    }
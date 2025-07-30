import os
import base64
import uuid
import requests
from io import BytesIO, BufferedReader
import asyncio
from datetime import datetime, timezone
from openai import OpenAI, AsyncOpenAI

from supabase import create_client
from core.config import settings

# 1. load env variables
STORAGE_BUCKET = settings.SUPABASE_STORAGE_BUCKET
OPENAI_API_KEY = settings.OPENAI_API_KEY

# 2. Supabase & OpenAI 클라이언트
client = AsyncOpenAI(api_key=OPENAI_API_KEY)
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE)

# 3. Supabase storage making it to fileobject
def supabase_image_to_fileobject(file_key, expires_in=600) -> base64:
    base = settings.SUPABASE_URL.rstrip("/")  # e.g. https://uscw…supabase.co
    public_url = f"{base}/storage/v1/object/public/{STORAGE_BUCKET}/{file_key}"
    
    resp = requests.get(public_url)
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
    buf = BufferedReader(BytesIO(image_bytes))
    
    # 3. Upload to Supabase storage
    base_name = os.path.basename(image_keys[0])
    generated_image_key = f"generated/{user_id}/{uuid.uuid4().hex}_{base_name}"
    # supabase.storage.from_(STORAGE_BUCKET).upload(generated_image_key, BytesIO(image_bytes))

    file_obj = BytesIO(image_bytes); file_obj.name = base_name
    supabase.storage.from_(STORAGE_BUCKET).upload(
        generated_image_key,
        buf,
        {
            "contentType": "image/jpeg"
         }
    )


    # 4. Making Public URL
    # public_url = supabase.storage.from_(STORAGE_BUCKET).get_public_url(generated_image_key)["publicUrl"] 
    # get_public_url() on the latest client returns a string
    public_url = supabase.storage.from_(STORAGE_BUCKET).get_public_url(generated_image_key)

    # 5. Store to DB
    images_row = {
        "image_id": str(uuid.uuid4()),
        "user_id" : user_id,
        "url" : public_url,
        "type" : "generated",
        "created_at" : datetime.now(timezone.utc).isoformat()
    }
    resp = supabase.table("images").insert(images_row).execute()

    # error handling
    if getattr(resp, "error", None):
        raise Exception(f"DB Load failed: {resp.error}")

    # 6. Ruturn output
    return {
        "image_key": generated_image_key,
        "url": public_url
    }
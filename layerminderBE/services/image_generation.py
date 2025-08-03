import os, uuid, base64, asyncio
from io import BytesIO, BufferedReader
from datetime import datetime, timezone
from typing import List, Optional

import httpx
from openai import AsyncOpenAI

from core.supabase_client import supabase
from core.config import settings

# 1. load env variables
STORAGE_BUCKET = settings.SUPABASE_STORAGE_BUCKET
OPENAI_API_KEY = settings.OPENAI_API_KEY
OPENAI_MODEL = "gpt-image-1"


# 2. OpenAI async client
client = AsyncOpenAI(api_key=OPENAI_API_KEY)

# 3. helper: Supabase storage making it to fileobject
async def _fetch_fileobject(file_key:str) -> BytesIO:
    base = settings.SUPABASE_URL.rstrip("/")  # e.g. https://uscw…supabase.co
    url = f"{base}/storage/v1/object/public/{STORAGE_BUCKET}/{file_key}"
    
    async with httpx.AsyncClient() as client:
        r = await client.get(url)
        r.raise_for_status()
    bio = BytesIO(r.content)
    bio.name = os.path.basename(file_key)
    return bio

# 4. base64 -> openAI gpt-image-1 API
async def generate_and_store_images(
        record_id:str,
        input_image_keys: List[str], 
        user_id: str,
        keyword: str = "modern" # default
        ) -> None:
    # error message
    if not input_image_keys:
        raise ValueError("You need minimum 1 image to proceed Layerminder.")
    
    # 1) Change the status
    supabase.table("history_records")\
        .update({
            "status": "processing",
            "updated_at": datetime.now(timezone.utc).isoformat()
        })\
        .eq("record_id", record_id)\
        .execute()
    
    # 2) Fetch files
    file_objs = await asyncio.gather(
        *[_fetch_fileobject(key) for key in input_image_keys]
    )

    # 3) Image Generation
    result = await client.images.edit(
        model=OPENAI_MODEL,
        image=file_objs,
        prompt= f'''
        Combine these two image into one thing that one can sit on.
        Details should be minimalistic and {keyword}(0.8), with a clean aesthetic.
        Take the key design concepts from the given image.
        ''' if keyword else None,
        quality="low",
        size="1024x1024",
        output_format="jpeg",
        output_compression=50,
        n=4
    )
    for idx, item in enumerate(result.data, start=1):
        img_bytes = base64.b64decode(item.b64_json)
        file_name = f"{uuid.uuid4().hex}.jpeg"

        # a) Upload to Supabase storage
        generated_key = f"generated/{user_id}/{file_name}"
        resp = supabase.storage.from_(STORAGE_BUCKET).upload(
            generated_key,
            img_bytes,
            {"contentType": "image/jpeg"}
        )
        public_url = supabase.storage.from_(STORAGE_BUCKET)\
            .get_public_url(generated_key)
    
        # b) INSERT into images table 
        new_image_id = str(uuid.uuid4())
        supabase.table("images").insert({
            "image_id": new_image_id,
            "user_id": user_id,
            "url": public_url,
            "type": "generated",
            "created_at": datetime.now(timezone.utc).isoformat()
        }).execute()

        # c) Mapping on history_record_images 
        supabase.table("history_record_images").insert({
            "record_id": record_id,
            "image_id": new_image_id,
            "seq": idx
        }).execute()

    # 7) status -> ready 
    supabase.table("history_records")\
        .update({
            "status": "ready",
            "updated_at": datetime.now(timezone.utc).isoformat()
        })\
        .eq("record_id", record_id)\
        .execute()
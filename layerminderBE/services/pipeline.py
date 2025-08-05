import asyncio
from datetime import datetime, timezone
from typing import Optional

from core.supabase_client import supabase
from services.image_generation import generate_and_store_images
from services.story_keyword_generation import generate_and_store_story_keywords
from services.recommedation import recommend_image

async def full_pipeline(
        record_id: str,
        input_image_keys: list[str],
        keyword: Optional[str],
        user_id: str
) -> None:
    now_iso = lambda: datetime.now(timezone.utc).isoformat()

    # 1) Image generation
    try:
        # status -> processing
        supabase.table("history_records")\
            .update({"image_status": "images_processing", "updated_at":now_iso()})\
            .eq("record_id", record_id).execute()
        
        await generate_and_store_images(record_id, input_image_keys, keyword, user_id)

        # after complete
        supabase.table("history_records")\
            .update({"image_status":"images_ready", "updated_at":now_iso()})\
            .eq("record_id", record_id).execute()
        
    except Exception as e:
        supabase.table("history_records")\
            .update({"image_status":"error_images", "updated_at":now_iso()})\
            .eq("record_id", record_id).execute()
        # Logging when needed
        print(f"[Pipeline] Image generation session {e}")
        return
    
    # 2) Story 7 keywords Generation
    try:
        supabase.table("history_records")\
            .update({"story_status": "processing",
                     "keywords_status": "processing",
                     "updated_at": now_iso()})\
            .eq("record_id", record_id).execute()
        
        await generate_and_store_story_keywords(record_id)

        # when it is created"
        supabase.table("history_records")\
            .update({"story_status":"ready", 
                     "keywords_status": "ready",
                     "status": "ready",
                     "updated_at":now_iso()})\
            .eq("record_id", record_id).execute()

    except Exception as e:
        supabase.table("history_records")\
            .update({"story_status":"error",
                     "keywords_status": "error", 
                     "updated_at":now_iso()})\
            .eq("record_id", record_id).execute()
        print(f"[Pipeline] Story generation failed: {e}")
        return
    
    # 3) Recommendation
    try:
        # a) Load images 
        rec_imgs = supabase.table("history_record_images")\
            .select("image_id")\
            .eq("record_id", record_id)\
            .order("seq", ascending=True)\
            .execute().data or []
        image_ids = [r["image_id"] for r in rec_imgs]

        # b) Recommend
        rec = recommend_image(image_ids, top_k=1)
        ref = rec.get("reference")
        ref_id = ref["id"] if ref else None

        # c) Update history_records
        supabase.table("history_records")\
            .update({"reference_image_id": ref_id, "updated_at": now_iso()})\
            .eq("record_id", record_id).execute()
    except Exception as e:
        print(f"[Pipeline] Recommendation failed: {e}")
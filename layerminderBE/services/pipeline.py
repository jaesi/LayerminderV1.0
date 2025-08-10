import asyncio
from datetime import datetime, timezone
from typing import Optional

from core.supabase_client import supabase
from services.image_generation import generate_and_store_images
from services.story_keyword_generation import generate_and_store_story_keywords
from services.recommendation import recommend_image

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

async def full_pipeline(
        record_id: str,
        input_image_keys: list[str],
        keyword: Optional[str],
        user_id: str
) -> None:
    """
    Orchestrates the whole generation pipeline:
    1) Image generation
    2) Story & keywords
    3) Recommendation (writes status + error for observability)
    """
    # 1) Image generation
    try:
        # status -> processing
        supabase.table("history_records")\
            .update({"image_status": "processing", 
                     "updated_at":now_iso()})\
            .eq("record_id", record_id).execute()
        
        await generate_and_store_images(record_id, input_image_keys, keyword, user_id)

        # after complete
        supabase.table("history_records")\
            .update({"image_status":"ready", 
                     "updated_at":now_iso()})\
            .eq("record_id", record_id).execute()
        
    except Exception as e:
        supabase.table("history_records")\
            .update({"image_status":"error", 
                     "updated_at":now_iso()})\
            .eq("record_id", record_id).execute()
        # Logging when needed
        print(f"[Pipeline] Image generation session {e}")
        return
    
    # 2) Story & keywords Generation
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
        # a) status for recommendation
        supabase.table("history_records").update({
            "recommendation_status": "processing",
            "updated_at": now_iso()
        }).eq("record_id", record_id).execute()

        # b) Load image urls
        rec_imgs = supabase.table("history_record_images")\
            .select("image_id, images(url)")\
            .eq("record_id", record_id)\
            .order("seq", desc=False)\
            .execute().data or []
        
        # Guard: no images to recommend from
        if not rec_imgs:
            supabase.table("history_records").update({
                "recommendation_status": "failed",
                "recommendation_error":"no_images_available",
                "updated_at": now_iso()
            }).eq("record_id", record_id).execute()
            print("[Pipeline] Recommendation skipped: no_images_available")
            return
        
        image_urls = [r["images"]["url"] for r in rec_imgs]

        # c) Recommend
        rec = await asyncio.to_thread(recommend_image, image_urls, 1)
        ref = (rec or {}).get("reference")
        ref_id = (ref or {}).get("id")

        # Guard: no candidate found
        if not ref_id:
            supabase.table("history_records").update({
                "recommendation_status": "failed",
                "recommendation_error": "no_candidate_found",
                "updated_at": now_iso()
            }).eq("record_id", record_id).execute()
            print("[Pipeline] Recommendation failed: no_candidate_found")
            return

        # d) Success: Update history_records
        supabase.table("history_records")\
            .update({"reference_image_id": ref_id,
                     "recommendation_status": "ready", 
                     "recommendation_error": None,
                     "updated_at": now_iso()})\
            .eq("record_id", record_id).execute()
        
    except Exception as e:
        # f) Unexpected failure
        supabase.table("history_records").update({
            "recommendation_status": "failed",
            "recommendation_error": f"{type(e).__name__}: {e}",
            "updated_at": now_iso()
        }).eq("record_id", record_id).execute()
        print(f"[Pipeline] Recommendation failed: {e}")
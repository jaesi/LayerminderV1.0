'''
Router for generation router's SSE
'''

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import asyncio, json 

from core.supabase_client import supabase

router = APIRouter(tags=['AI'])

@router.get("/stream/{record_id}")
async def stream_generation(record_id: str):
    # 1) Check if record exists
    record = supabase.table("history_records")\
        .select("*")\
        .eq("record_id", record_id)\
        .single().execute()
    if not record.data:
        raise HTTPException(status_code=404, detail="Record not found")
    
    async def event_generator():
        sent = {"image": False, "story": False, "keywords": False, "recommendation": False}

        while True:
            data = supabase.table("history_records")\
                .select("image_status, story_status, keywords_status, reference_image_id")\
                .eq("record_id", record_id)\
                .single().execute().data
            
            # 1) if image status is ready
            if not sent["image"] and data["image_status"] == "images_ready":
                imgs = supabase.table("history_record_images")\
                    .select("image_id, seq")\
                    .eq("record_id", record_id)\
                    .execute().data
                yield f"event: images_generated\ndata: {json.dumps(imgs)}\n\n"
                sent["image"] = True

            # 2) if story status is ready
            if not sent["story"] and data["story_status"] == "ready":
                story = supabase.table("history_records")\
                    .select("story")\
                    .eq("record_id", record_id)\
                    .single().execute().data
                yield f"event: story_generated\ndata: {json.dumps(story)}\n\n"
                sent["story"] = True
            
            # 3) if keywords status is ready
            if not sent["keywords"] and data["keywords_status"] == "ready":
                keywords = supabase.table("history_records")\
                    .select("keywords")\
                    .eq("record_id", record_id)\
                    .single().execute().data
                yield f"event: keywords_generated\ndata: {json.dumps(keywords)}\n\n"
                sent["keywords"] = True

            # 4) if recommendation is ready
            if not sent["recommendation"] and data["reference_image_id"]:
                recommendation = supabase.table("history_records")\
                    .select("reference_image_id")\
                    .eq("record_id", record_id)\
                    .single().execute().data
                yield f"event: recommendation_generated\ndata: {json.dumps(recommendation)}\n\n"
                sent["recommendation"] = True
            
            # 5) If all sent, break
            if all(sent.values()):
                break

            # 6) Wait for a while before next check
            await asyncio.sleep(1)
    
    return StreamingResponse(event_generator(), media_type="text/event-stream")
        
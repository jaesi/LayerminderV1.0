'''
Router for generation router's SSE
'''

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import asyncio
import json
import time

from core.supabase_client import supabase

router = APIRouter(tags=["AI"])

# ---- Tunables ----
POLL_INTERVAL_SEC = 1.0          
TIMEOUT_SEC = 90.0               
HEARTBEAT_INTERVAL_SEC = 20.0
READY = "ready"
FAILED = "failed"
ERROR_STATES_IMAGE={"error_images", "error"}

def sse_event(event: str, data: dict | list | str) -> str:
    """Format a Server-Sent Event."""
    payload = data if isinstance(data, str) else json.dumps(data, ensure_ascii=False)
    return f"event: {event}\ndata: {payload}\n\n"


@router.get("/stream/{record_id}")
async def stream_generation(record_id: str):
    # 1) Pre-check: record existence (fail fast)
    try:
        record = (
            supabase.table("history_records")
            .select("record_id")
            .eq("record_id", record_id)
            .single()
            .execute()
        )
        if not record.data:
            raise HTTPException(status_code=404, detail="Record not found")
    except Exception as e:
        # If Supabase itself errors on the pre-check, surface that
        raise HTTPException(status_code=500, detail=f"Precheck failed: {e}")

    async def event_generator():
        sent = {"image": False, "story": False, "keywords": False, "recommendation": False}
        start = time.monotonic()
        last_heartbeat = start

        try:
            while True:
                # Timeout guard
                now = time.monotonic()
                if now - start > TIMEOUT_SEC:
                    yield sse_event("generation_failed", {"reason": "timeout"})
                    return

                # Heartbeat ping
                if now - last_heartbeat >= HEARTBEAT_INTERVAL_SEC:
                    yield sse_event("ping", {"t": int(now)})
                    last_heartbeat = now

                # Poll the minimal status fields
                try:
                    row = (
                        supabase.table("history_records")
                        .select("image_status,story_status,keywords_status,reference_image_id,recommendation_status,recommendation_error")
                        .eq("record_id", record_id)
                        .single()
                        .execute()
                        .data
                    )
                    if not row:
                        yield sse_event("error", {"step": "poll", "error": "record_not_found"})
                        break
                except Exception as e:
                    yield sse_event("error", {"step": "poll", "error": str(e)})
                    await asyncio.sleep(POLL_INTERVAL_SEC)
                    continue  # keep trying until timeout

                if row.get("image_status") in ERROR_STATES_IMAGE:
                    yield sse_event("generation_failed", {"reason": "stage_failed", "stage": "image"})
                    return
                if row.get("story_status") == "error":
                    yield sse_event("generation_failed", {"reason": "stage_failed", "stage": "story"})
                    retuen
                if row.get("keywords_status") == "error":
                    yield sse_event("generation_failed", {"reason":"stage_failed", "stage": "keywords"})
                    return
                
                # 1) images ready
                if not sent["image"] and row.get("image_status") == "ready":
                    try:
                        imgs = (
                            supabase.table("history_record_images")
                            .select("image_id,seq")
                            .eq("record_id", record_id)
                            .order("seq")
                            .execute()
                            .data
                        ) or []
                        yield sse_event("images_generated", imgs)
                        sent["image"] = True
                    except Exception as e:
                        yield sse_event("error", {"step": "images", "error": str(e)})

                # 2) story ready
                if not sent["story"] and row.get("story_status") == "ready":
                    try:
                        story = (
                            supabase.table("history_records")
                            .select("story")
                            .eq("record_id", record_id)
                            .single()
                            .execute()
                            .data
                        ) or {}
                        yield sse_event("story_generated", story)
                        sent["story"] = True
                    except Exception as e:
                        yield sse_event("error", {"step": "story", "error": str(e)})

                # 3) keywords ready
                if not sent["keywords"] and row.get("keywords_status") == "ready":
                    try:
                        keywords = (
                            supabase.table("history_records")
                            .select("keywords")
                            .eq("record_id", record_id)
                            .single()
                            .execute()
                            .data
                        ) or {}
                        yield sse_event("keywords_generated", keywords)
                        sent["keywords"] = True
                    except Exception as e:
                        yield sse_event("error", {"step": "keywords", "error": str(e)})

                # 4) recommendation ready (presence check)
                rec_status = row.get("recommendation_status")
                if rec_status == FAILED:
                    yield sse_event("error", {
                        "step": "recommendation",
                        "error": row.get("recommendation_error") or "unknown"
                    })
                    return
                
                if (not sent["recommendation"]) and (rec_status == 'ready'):
                    yield sse_event("recommendation_generated", {
                        "reference_image_id": row.get("reference_image_id")
                    })
                    sent["recommendation"] = True

                # Done?
                if all(sent.values()):
                    yield sse_event("done", {"ok": True})
                    return

                await asyncio.sleep(POLL_INTERVAL_SEC)

        except asyncio.CancelledError:
            # Client disconnected; just exit quietly
            # (Optionally emit a final diagnostic event)
            return
        except Exception as e:
            # Any unexpected exception: emit error and close
            yield sse_event("error", {"step": "unexpected", "error": str(e)})

    # Extra headers to reduce proxy buffering and caching
    headers = {
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",  # NGINX: disable response buffering
    }

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers=headers
    )
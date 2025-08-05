import asyncio, base64, httpx
from datetime import datetime, timezone
from openai import AsyncOpenAI

from core.supabase_client import supabase
from core.config import settings 

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
CHAT_GPT_MODEL = "gpt-4.1-nano"


async def generate_and_store_story_keywords(record_id: str):
    """
    1) history_record_images -> load url list from images table
    2) Image URL and system message to prompt
    3) Keyword parsing
    4) history_records table story, keywords, update
    """
    now = datetime.now(timezone.utc).isoformat()

    # 1) story_status -> processing
    supabase.table("history_records")\
        .update({"story_status":"processing",
                 "keywords_status": "processing", 
                 "updated_at": now})\
        .eq("record_id", record_id)\
        .execute()
    
    # 2) Get images from history_record_images
    rec_imgs = supabase.table("history_record_images")\
        .select("image_id, seq")\
        .eq("record_id", record_id)\
        .execute().data or []
    image_ids = [r["image_id"] for r in rec_imgs]
    
    # 3) Get urls from images table
    imgs = supabase.table("images")\
        .select("url")\
        .in_("image_id", image_ids)\
        .execute().data or []
    
    urls = [i["url"] for i in imgs]

    # 4) First image URL fetch -> base64 encode
    async with httpx.AsyncClient() as http:
        resp = await http.get(urls[0])
        resp.raise_for_status()
        b64 = base64.b64encode(resp.content).decode("utf-8")


    # 4) Generate story with OpenAI
    # - Set chat message

    system = {
        "role": "system",
        "content": """
        You are a specialist in writing elegant and culturally-informed product descriptions for furniture collections.
        Avoid fictional names or creators. Focus on real-world design, material inspiration, and symbolic language in a minimalist tone.
        """
    }

    user = {
        "role": "user",
        "content": """
    You are a product description writer for a premium furniture brand that values cultural inspiration, minimal design, and material storytelling.

    Analyze the furniture shown in the image and generate a description with the following format:

    Name: <concise name including object type, e.g. 'Nordic Oak Table'>
    Dimensions: Width: <value> cm, Depth: <value> cm, Height: <value> cm
    Material: <plausible, realistic materials such as 'oak wood', 'brushed steel', 'marble'>

    Title: "<longer, expressive title that captures the cultural or emotional inspiration of the piece>"

    Story: Two refined paragraphs, with one empty line in between.
    - Paragraph 1: Explain the cultural or environmental inspiration of the design and materials.
    - Paragraph 2: Describe the symbolic or functional design elements, and what they convey.

    Then, extract **exactly 12 single-word English keywords** that represent:
    - The furniture's **style** (e.g., minimal, modern)
    - Its **geometric form or structure** (e.g., curved, cylindrical, angular, layered)
    - Its **materials or finishes** (e.g., velvet, walnut, brushed, marble)

    Requirements:
    - At least 5 keywords must clearly relate to details present in the "story".
    - Avoid abstract terms (e.g., 'confident', 'honest') and generic types (e.g., 'chair').
    - Do not include duplicate or overly technical terms. (e.g., "ergonomic")

    Return the output in the following format:

    <Full Description Text>

    Keywords: keyword1, keyword2, keyword3, ..., keyword12
    """
    }

    image_message = {
        "role": "user",
        "content": "",
        "type": "image_url",
        "image_url": {
            "url": f"data:image/jpeg;base64,{b64}"
        }
    }

    completion = await client.chat.completions.create(
        model=CHAT_GPT_MODEL,
        messages=[system, user, image_message],
        max_tokens=1500,
        temperature=0.7
    )

    result = completion.choices[0].message.content.strip()


    # 5) parse output: "Keyword"
    if "Keywords:" in result:
        desc, kw_line = result.split("Keywords:", 1)
        keywords = [k.strip() for k in kw_line.split(",") if k.strip()]
    else:
        desc = result
        keywords = []

    # 6) Update DB: story, keywords -> all ready
    supabase.table("history_records")\
        .update({
            "story": desc.strip(),
            "keywords": keywords,
            "story_status": "ready",
            "keywords_status": "ready",
            "updated_at": now
        })\
        .eq("record_id", record_id)\
        .execute()

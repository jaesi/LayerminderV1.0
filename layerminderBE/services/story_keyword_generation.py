import asyncio
from datetime import datetime, timezone
from openai import AsyncOpenAI
from langchain.schema import SystemMessage, HumanMessage

from core.supabase_client import supabase
from core.config import settings 

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
CHAT_GPT_MODEL = "gpt-4o"

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

    if not urls:
        raise ValueError(f"No images for record {record_id}")
    
    # 4) Generate story with OpenAI
    # - Set chat message
    system_message = {
        "role": "system",
        "content": (
            "You are a specialist in writing elegant and culturally-informed "
            "product descriptions for a premium furniture brand. Avoid fictional "
            "names. Focus on real-world design, material inspiration, and symbolic "
            "language in a minimalist tone."
        )
    }

    user_prompt = {
        "role": "user",
        "content": (
    """
    You are a product description writer for a premium furniture brand that values 
    cultural inspiration, minimal design, and material storytelling.

    Analyze the furniture shown in the image(s) and generate a description with the 
    following format:

    Name: <concise name including object type>
    Dimensions: Width: <value> cm, Depth: <value> cm, Height: <value> cm
    Material: <realistic material>

    Title: "<longer, expressive title capturing cultural or emotional inspiration>"

    Story: Two refined paragraphs (one blank line between):
    - Paragraph 1: Cultural/environmental inspiration
    - Paragraph 2: Symbolic or functional design elements

    Then extract exactly 12 single-word English keywords:
    - 5+ must come from the story
    - Categories: style, form, materials

    Return as:

    <Full Description Text>

    Keywords: word1, word2, ..., word12
    """)
    }

    image_messages = [
        {
            "role" : "user",
            "content": "",
            "type" : "image_url",
            "image_url" : {"url": url}
        }
        for url in urls
    ]

    messages = [system_message, user_prompt] + image_messages

    # 4) Call chat 
    resp = await client.chat.completions.create(
        model=CHAT_GPT_MODEL,
        messages= messages,
        temperature=0.75,
        max_tokens=1200
    )
    result = resp.choices[0].message.content.strip()

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

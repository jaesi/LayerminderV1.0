import asyncio
from datetime import datetime, timezone
from openai import AsyncOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

from core.supabase_client import supabase
from core.config import settings 
import base64
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
CHAT_GPT_MODEL = "gpt-4.1-nano"

# helper function to encode image to base64
def encode_image_to_base64(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")

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
    first_url = urls[0]

    base64_image = encode_image_to_base64(first_url)

    if not urls:
        raise ValueError(f"No images for record {record_id}")
    


    # 4) Generate story with OpenAI
    # - Set chat message

    prompt_text = """
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

    chat = ChatOpenAI(model=CHAT_GPT_MODEL, temperature=0.75, max_tokens=1200)

    messages = [
        SystemMessage(content="""
        You are a specialist in writing elegant and culturally-informed product descriptions for furniture collections.
        Avoid fictional names or creators. Focus on real-world design, material inspiration, and symbolic language in a minimalist tone.
        """),
        HumanMessage(content=[
            {"type": "text", "text": prompt_text},
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
        ])
    ]
    # 4) Call chat 
    response = chat.invoke(messages)
    result_text = response.content.strip()



    # 5) parse output: "Keyword"
    if "Keywords:" in result_text:
        desc, kw_line = result_text.split("Keywords:", 1)
        keywords = [k.strip() for k in kw_line.split(",") if k.strip()]
    else:
        desc = result_text
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

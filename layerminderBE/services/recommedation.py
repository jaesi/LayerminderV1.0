import numpy as np
import faiss
import requests
from io import BytesIO
import csv

from core.supabase_client import supabase


# 1. Load CLIP model, index, metadata 
FAISS_INDEX = "batch/embeddings/image_embeddings.index"
METADATA = "batch/embeddings/image_embeddings_metadata.csv"

faiss_index = faiss.read_index(FAISS_INDEX)
with open(METADATA, encoding='utf-8') as f:
    metadata = list(csv.DictReader(f))

# 2. Service functions
def get_image_embedding(url: str) -> np.ndarray:
    "Fetches an image from a URL, processes it, and returns its embedding."
    # url -> CLIP
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    from PIL import Image
    from transformers import CLIPProcessor, CLIPModel
    import torch

    img = Image.open(BytesIO(response.content)).convert("RGB")
    model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
    processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
    inputs = processor(image=img, return_tensors="pt").to(device)
    with torch.no_grad():
        features = model.get_image_features(**inputs)
        features = features / features.norm(dim=-1, keepdim=True)
    return features.cpu().numpy()[0]

def get_urls_from_db(image_ids: list[str]) -> list[str]:
    response = supabase.table("images").select("image_id, url").in_("image_id", image_ids).execute()
    if getattr(response, "error", None):
        raise RuntimeError(f"DB error: {response.error}")
    return [r["url"] for r in response.data]

# Main recommendation function
def recommend_image(image_ids: list[str], top_k: int =1) -> dict:
    # Four images -> mean of embeddings -> FAISS top 1 return
    # 1) get URLs from DB
    urls = get_urls_from_db(image_ids)
    if not urls or len(urls) < len(image_ids):
        return {"error": "Some image IDs not found in database."}
    
    # 2) Mean of user images embeddings
    features = [get_image_embedding(url) for url in urls]
    mean_vec = np.mean(np.stack(features), axis=0, keepdims=True)
   
    # 3) FAISS search
    D, I = faiss_index.search(mean_vec, top_k + len(image_ids))

    # 4) index -> metadata
    for idx in I[0]:
        recommendation = metadata[idx]
        if recommendation["image_id"] not in image_ids:
            return {"reference": {"id": recommendation["image_id"], "url": recommendation["url"]}}

    return {"reference": None}
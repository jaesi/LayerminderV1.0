import numpy as np
import faiss
from PIL import Image
from transformers import CLIPProcessor, CLIPModel
import requests
from io import BytesIO
import torch
import csv
from core.supabase_client import supabase


# 1. Load CLIP model, index, metadata 
FAISS_INDEX = "batch/embeddings/image_embeddings.index"
METADATA = "batch/embeddings/image_embeddings_metadata.csv"

faiss_index = faiss.read_index(FAISS_INDEX)
with open(METADATA, encoding='utf-8') as f:
    metadata = list(csv.DictReader(f))

device = "cuda" if torch.cuda.is_available() else "cpu"
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

# 2. Service functions
def get_image_embedding(url: str) -> np.ndarray:
    "Fetches an image from a URL, processes it, and returns its embedding."
    # url -> CLIP
    response = requests.get(url, timeout=10)
    img = Image.open(BytesIO(response.content)).convert("RGB")
    inputs = processor(image=img, return_tensors="pt").to(device)
    with torch.no_grad():
        features = model.get_image_features(**inputs)
        features = features / features.norm(dim=-1, keepdim=True)
        return features.cpu().numpy()[0]

def get_urls_from_db(image_ids: list[str]) -> list[str]:
    response = supabase.table("images").select("id, url").in_("id", image_ids).execute()
    if getattr(response, "error", None):
        raise RuntimeError(f"DB error: {response.error}")
    records = response.data
    id_to_url = {rec['id']: rec['url'] for rec in records}
    return [id_to_url.get(i) for i in image_ids if id_to_url.get(i)]

# Main recommendation function
def recommend_image(image_ids: list[str], top_k: int =1) -> dict:
    "4 image ids -> mean of embeddings -> FAISS top 1 return"
    # 1) get embedding of input images
    urls = get_urls_from_db(image_ids)
    if not urls or len(urls) < len(image_ids):
        return {"error": "Some image IDs not found in database."}
    
    # 2) Mean of user images embeddings
    features = [get_image_embedding(url) for url in urls]
    mean_vec = np.mean(np.stack(features), axis=0, keepdims=True)
   
    # 3) FAISS search
    D, I = faiss_index.search(mean_vec, top_k + len(image_ids))

    # 4) index -> metadata
    index_to_metadata = {i: m for i, m in enumerate(metadata)}
    for idx in I[0]:
        recommendation = index_to_metadata.get(idx)
        if recommendation and recommendation["id"] not in image_ids:
            return {"reference": {"id": recommendation["id"], "url": recommendation["url"]}}
    
    return {"reference": None}



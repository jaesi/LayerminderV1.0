import numpy as np
import faiss
import requests
from io import BytesIO
import csv
import os

from core.supabase_client import supabase

# Resolve KMP duplicate library issue
os.environ['KMP_DUPLICATE_LIB_OK']='True'

# 1. Load CLIP model, index, metadata 
# FAISS_INDEX = "layerminderBE/batch/embeddings/image_embeddings.index"
# METADATA = "layerminderBE/batch/embeddings/image_embeddings_metadata.csv"

faiss_index = faiss.read_index(FAISS_INDEX)
with open(METADATA, encoding='utf-8') as f:
    metadata = list(csv.DictReader(f))

# helper: Extract image IDs from metadata
def get_image_embedding(url: str) -> np.ndarray:
    "Fetches an image from a URL, processes it, and returns its embedding."
    # url -> CLIP
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    from PIL import Image
    from transformers import CLIPProcessor, CLIPModel
    import torch

    img = Image.open(BytesIO(response.content)).convert("RGB")
    device = "cpu"
    model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
    processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32",
                                              use_fast=True)
    inputs = processor(images=img, return_tensors="pt").to(device)
    with torch.no_grad():
        features = model.get_image_features(**inputs)
        features = features / features.norm(dim=-1, keepdim=True)
    return features.cpu().numpy()[0]

# 2. Service functions: Main recommendation function
# Four images -> mean of embeddings -> FAISS top 1 return
def recommend_image(urls: list[str], 
                    top_k: int =1) -> dict:
    
    if not urls:
        return {"reference": None}
    
    # 1) Mean of user images embeddings
    features = [get_image_embedding(url) for url in urls]
    mean_vec = np.mean(np.stack(features), axis=0, keepdims=True)
   
    # 2) FAISS search
    D, I = faiss_index.search(mean_vec, top_k)

    # 3) index -> metadata
    best_idx = I[0][0]
    recommendation = metadata[best_idx]
    return {"reference": {"id": recommendation["reference_image_id"], 
                          "url": recommendation["url"]}}


if __name__ == "__main__":
    # Test usage
    urls = [
        "https://uscwuogmxxaxwvfueasr.supabase.co/storage/v1/object/public/layerminder/generated/d00af0f8-18be-41bc-b080-97a687e1952d/464a443450b84bc58e5562916145133b_1753962489036_bxzdxc.jpg?",
        "https://uscwuogmxxaxwvfueasr.supabase.co/storage/v1/object/public/layerminder/generated/d00af0f8-18be-41bc-b080-97a687e1952d/464a443450b84bc58e5562916145133b_1753962489036_bxzdxc.jpg?",
        "https://uscwuogmxxaxwvfueasr.supabase.co/storage/v1/object/public/layerminder/generated/d00af0f8-18be-41bc-b080-97a687e1952d/464a443450b84bc58e5562916145133b_1753962489036_bxzdxc.jpg?",
        "https://uscwuogmxxaxwvfueasr.supabase.co/storage/v1/object/public/layerminder/generated/d00af0f8-18be-41bc-b080-97a687e1952d/464a443450b84bc58e5562916145133b_1753962489036_bxzdxc.jpg?"
    ]
    recommendation = recommend_image(urls, top_k=1)
    print(recommendation)
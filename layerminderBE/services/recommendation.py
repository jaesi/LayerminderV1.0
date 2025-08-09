import numpy as np
import faiss
import requests
from io import BytesIO
import csv
import os

from core.supabase_client import supabase

# Resolve KMP duplicate library issue
os.environ['OMP_NUM_THREADS'] = '1'
os.environ['KMP_DUPLICATE_LIB_OK'] = 'True'

FAISS_INDEX = "batch/embeddings/image_embeddings.index"
METADATA = "batch/embeddings/image_embeddings_metadata.csv"

# Global cache variables
_faiss_index = None
_metadata = None
_clip_model = None
_clip_processor = None

def load_index():
    """ Import Faiss and metadata only one time"""
    global _faiss_index, _metadata
    if _faiss_index is None or _metadata is None:
        print("[INFO] Loading FAISS index and metadata...")
        _faiss_index = faiss.read_index(FAISS_INDEX)
        with open(METADATA, encoding='utf-8') as f:
            _metadata = list(csv.DictReader(f))
    return _faiss_index, _metadata

def load_clip():
    """Load CLIP model and Processor only one time"""
    global _clip_model, _clip_processor
    if _clip_model is None or _clip_processor is None:
        print("[INFO] Loading CLIP model and processor...")
        from transformers import CLIPProcessor, CLIPModel
        import torch
        device = "cpu"
        _clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
        _clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32", use_fast=True)
    return _clip_model, _clip_processor
    
def get_image_embedding(url: str) -> np.ndarray:
    from PIL import Image
    import torch

    response = requests.get(url, timeout=10)
    response.raise_for_status()
    img = Image.open(BytesIO(response.content)).convert("RGB")

    model, processor = load_clip()
    device = "cpu"
    inputs = processor(images=img, return_tensors="pt").to(device)

    with torch.no_grad():
        features = model.get_image_features(**inputs)
        features = features / features.norm(dim=-1, keepdim=True)
    return features.cpu().numpy()[0]

def recommend_image(urls: list[str], top_k: int = 1) -> dict:
    if not urls:
        return {"reference": None}

    faiss_index, metadata = load_index()
    features = [get_image_embedding(url) for url in urls]
    mean_vec = np.mean(np.stack(features), axis=0, keepdims=True)

    D, I = faiss_index.search(mean_vec, top_k)
    best_idx = I[0][0]
    recommendation = metadata[best_idx]
    return {"reference": {"id": recommendation["reference_image_id"], "url": recommendation["url"]}}

# test snippet
if __name__ == "__main__":
    urls = [
        "https://uscwuogmxxaxwvfueasr.supabase.co/storage/v1/object/public/layerminder/generated/d00af0f8-18be-41bc-b080-97a687e1952d/464a443450b84bc58e5562916145133b_1753962489036_bxzdxc.jpg?"
    ] * 4
    print(recommend_image(urls))
import numpy as np
import faiss
from PIL import Image
from transformers import CLIPProcessor, CLIPModel
import requests
from io import BytesIO
import torch
import csv
import os

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

def recommend_image(image_ids: list[str], top_k: int =1) -> dict:
    "4 image ids -> mean of embeddings -> FAISS top 1 return"
    # id -> url
    urls = [m['url'] for m in metadata if m['id'] in image_ids]
    features = [get_image_embedding(url) for url in urls]
    mean_vec = np.mean(np.stack(features), axis=0, keepdims=True)
    D, I = faiss_index.search(mean_vec, top_k + len(image_ids)) 
    # exclude input image ids
    for idx in I[0]
    rec = metadata[idx]
    if rec["id"] not in image_ids:
        return {'reference': {rec['id']: rec['url']}}
    return {"reference": None}
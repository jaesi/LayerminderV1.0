import os
import requests 
from PIL import Image
import numpy as np
import torch
from transformers import CLIPProcessor, CLIPModel
from supabase import create_client
from core.config import settings
import csv
import faiss

'''
This script fetches images from a Supabase storage bucket, 
processes them using a CLIP model to generate embeddings, 
and saves these embeddings along with their metadata in a Faiss index and a CSV file.
'''

# env setting 
REFERENCE_URL = settings.REFERENCE_URL
SUPABASE_KEY = settings.SUPABASE_SERVICE_ROLE
REFERENCE_STORAGE_BUCKET = settings.REFERENCE_STORAGE_BUCKET
FOLDER = 'reference/' # directory name for embed

# 1. Connect Supabase
supabase = create_client(REFERENCE_URL, SUPABASE_KEY)

# 2. Fetch image list
img_list = supabase.storage.from_(REFERENCE_STORAGE_BUCKET).list(FOLDER)
img_files = [f['name'] for f in img_list if f['name'].lower().endswith(('.jpg', '.jpeg','.png','.bmp', 'webp'))]

# 3. CLIP model load
device = "cuda" if torch.cuda.is_available() else "cpu" # mps for silicon mac 
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32", use_fast=True)

# 4. Save embeddings
embeddings = []
metadata = []
total = len(img_files)

for idx, filename in enumerate(img_files, 1):
    img_id = os.path.splitext(os.path.basename(filename))[0]
    url = f"{REFERENCE_URL}/storage/v1/object/public/{REFERENCE_STORAGE_BUCKET}/{FOLDER}{filename}"
    try:
        # image -> url upload
        response = requests.get(url, stream=True, timeout=10)
        image = Image.open(response.raw).convert("RGB") # read image bytes from response 
        inputs = processor(images=image, return_tensors="pt").to(device) # preprocessing before embedding
        with torch.no_grad():
            features = model.get_image_features(**inputs)
            features = features / features.norm(dim=-1, keepdim=True) # L2 norm
            arr = features.cpu().numpy()[0]
        embeddings.append(arr)
        metadata.append({'id':img_id, 'url':url})
        percent = int((idx / total) *100)
        print(f"{percent}% Image embedded: {img_id} ({idx}/{total})")
    except Exception as e:
        print(f"[ERROR] {filename}: {e}")

# 5. Embedding & Saving metadata in faiss
os.makedirs("batch/embeddings", exist_ok=True)

embeddings = np.stack(embeddings)
d = embeddings.shape[1]
index = faiss.IndexFlatL2(d)
index.add(embeddings)
faiss.write_index(index, "batch/embeddings/image_embeddings.index")

with open("batch/embeddings/image_embeddings_metadata.csv", "w", newline="", encoding = "utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=['id', 'url'])
    writer.writeheader()
    writer.writerows(metadata)

print(f"{len(embeddings)} embeddings saved")          
import os
import requests 
from PIL import Image
import numpy as np
import torch
from transformers import CLIPProcessor, CLIPModel
from supabase import create_client
import faiss
from datetime import datetime
import uuid
import io
import csv

from core.config import settings

'''
This script fetches images from a Supabase storage bucket, 
processes them using a CLIP model to generate embeddings, 
and saves these embeddings along with their metadata in a Faiss index and a CSV file.
'''

# env setting 
REFERENCE_URL = settings.REFERENCE_URL
SUPABASE_KEY = settings.SUPABASE_SERVICE_ROLE
REFERENCE_STORAGE_BUCKET = settings.REFERENCE_STORAGE_BUCKET
FOLDER = 'reference/'
csv_path = "batch/embeddings/image_embeddings_metadata.csv"

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
rows_to_upsert = []
total = len(img_files)

now = datetime.now().isoformat()

# 5. fetch and embed images
for idx, filename in enumerate(img_files, 1):
    img_id = os.path.splitext(os.path.basename(filename))[0]
    url = f"{REFERENCE_URL}/storage/v1/object/public/{REFERENCE_STORAGE_BUCKET}/{FOLDER}{filename}"
    try:
        # image -> url upload
        response = requests.get(url, timeout=10)
        response.raise_for_status()  # Check for HTTP errors
        # 2) BytesIO -> PIL Image
        image = Image.open(io.BytesIO(response.content)).convert("RGB") # read image bytes from response 
        response.close()
        inputs = processor(images=image, return_tensors="pt").to(device) # preprocessing before embedding
        with torch.no_grad():
            features = model.get_image_features(**inputs)
            features = features / features.norm(dim=-1, keepdim=True) # L2 norm
            arr = features.cpu().numpy()[0]
        embeddings.append(arr)

        # Prepare metadata
        new_id = str(uuid.uuid4())
        rows_to_upsert.append({
            "reference_image_id": new_id,
            "url": url,
            "created_at": now
        })
        percent = int((idx / total) *100)
        print(f"{percent}% Image embedded: {img_id} ({idx}/{total})")
    except Exception as e:
        print(f"[ERROR] {filename}: {e}")

# # 6. Embedding in faiss
os.makedirs("batch/embeddings", exist_ok=True)

embeddings = np.stack(embeddings)
d = embeddings.shape[1]
index = faiss.IndexFlatL2(d)
index.add(embeddings)
faiss.write_index(index, "batch/embeddings/image_embeddings.index")
print(f"{len(embeddings)} embeddings saved")

# 7. Save metadata to local CSV
with open(csv_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["reference_image_id", "url", "created_at"])
    writer.writeheader()
    writer.writerows(rows_to_upsert)
print(f"{len(rows_to_upsert)} metadata rows saved to {csv_path}.")

# 8. Push to supabase storage
BATCH = 100
for i in range(0, len(rows_to_upsert), BATCH):
    chunk = rows_to_upsert[i:i + BATCH]
    resp = supabase.table("reference_image_pool")\
        .upsert(chunk, on_conflict="reference_image_id")\
        .execute()

print(f"{len(rows_to_upsert)} rows upserted to reference_image_pool")
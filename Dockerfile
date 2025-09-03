# 1) Base Python
FROM python:3.11-slim

# 2) System deps for image/video processing (Pillow/torchvision 등)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 ffmpeg \
 && rm -rf /var/lib/apt/lists/*

# 3) Workdir
WORKDIR /app

# 4) Install poetry
RUN pip install --no-cache-dir "poetry==1.8.2"

# 5) only copy the poetry metadata
COPY pyproject.toml poetry.lock* ./

# 5) Export requiremets.txt(Only main)
RUN poetry export -f requirements.txt --only main --without-hashes -o requirements.txt

# 6) PyTorch + torchvision (CPU) install first
RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu \
    torch==2.3.1 \
&& pip install --no-cache-dir --prefer-binary -r requirements.txt

# 6) COPY project meta file → install dependency (for build cache)
COPY pyproject.toml poetry.lock* ./
RUN poetry config virtualenvs.create false \
 && poetry install --only main --no-interaction --no-ansi --no-root

# 7) COPY app source
COPY layerminderBE/ .

# 8) Runtime env 
ENV PYTHONPATH=/app \
    OMP_NUM_THREADS=1 \
    KMP_DUPLICATE_LIB_OK=TRUE\
    TRANSFORMERS_NO_TORCHVISION=1\
    TRANSFORMERS_IMAGE_PROCESSING_USE_FAST=0

# 9) Port
EXPOSE 8000

# 10) Start server
CMD ["uvicorn", "run:app", "--host", "0.0.0.0", "--port", "8000"]
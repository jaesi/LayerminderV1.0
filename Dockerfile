# 1. Base python image
FROM python:3.11-slim

# 2. working directory
WORKDIR /app

# 3. Copy pyproject.toml, poetry.lock
COPY pyproject.toml poetry.lock* README.md /app/

# 4. Poetry install & Poetry requirements install
RUN pip install poetry && poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi --no-root

# 5. Copy else source Code
COPY layerminderBE /app

# 6. Open Port
EXPOSE 8000

# 7. Path setting
ENV PYTHONPATH=/app

# 8. Fast API execute
CMD ["uvicorn", "run:app", "--host", "0.0.0.0", "--port", "8000"]
# core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

class Settings(BaseSettings):
    OPENAI_API_KEY: str
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE: str
    SUPABASE_STORAGE_BUCKET: str
    SUPABASE_JWT_SECRET: str
    DATABASE_URL: str
    REFERENCE_URL: str
    REFERENCE_STORAGE_BUCKET: str
    JWT_SECRET: str

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).parent.parent/".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

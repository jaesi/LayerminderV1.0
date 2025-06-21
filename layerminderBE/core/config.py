# core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    OPENAI_API_KEY: str
    SUPABASE_URL: str
    SUPABASE_KEY: str
    STORAGE_BUCKET: str

    model_config = SettingsConfigDict(
        env_file=".env",  # 루트 경로라면 이렇게!
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
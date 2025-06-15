from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Configuration for env file
    model_config = SettingsConfigDict(
        env_file="layerminderBE/.env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Stability AI
    STABILITYAI_API_KEY: str

    # OpenAI Completion
    OPENAI_API_KEY: str


# Instantiate settings for import everywhere
settings = Settings()
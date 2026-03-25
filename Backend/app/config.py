"""
config.py — Application configuration using Pydantic Settings.
Reads settings from environment variables or .env file.
For AWS RDS, populate the RDS* variables; DATABASE_URL is built automatically.
"""

from pydantic_settings import BaseSettings
from pydantic import computed_field
from functools import lru_cache


class Settings(BaseSettings):
    # -- App --
    APP_NAME: str = "ResolveX-AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # -- AWS RDS PostgreSQL --
    # Set these in your .env file (copy from .env.example)
    RDS_HOST: str = "your-rds-endpoint.rds.amazonaws.com"
    RDS_PORT: int = 5432
    RDS_DB: str = "resolvex"
    RDS_USER: str = "postgres"
    RDS_PASSWORD: str = "changeme"
    RDS_SSL: bool = True   # set False only for local dev without SSL

    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        """Build the asyncpg-compatible PostgreSQL DSN from RDS fields."""
        import urllib.parse
        quoted_password = urllib.parse.quote_plus(self.RDS_PASSWORD)
        return (
            f"postgresql+psycopg2://{self.RDS_USER}:{quoted_password}"
            f"@{self.RDS_HOST}:{self.RDS_PORT}/{self.RDS_DB}"
        )

    # -- Groq LLM --
    GROQ_API_KEY: str = "your-groq-api-key-here"
    GROQ_MODEL: str = "llama3-8b-8192"

    # -- Confidence Thresholds --
    AUTO_RESOLVE_THRESHOLD: float = 0.75  # confidence >= this → auto-resolve
    HITL_THRESHOLD: float = 0.50          # confidence < this → escalate to human

    # -- Storage --
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 10

    # -- FAISS --
    FAISS_INDEX_PATH: str = "storage/faiss_index.bin"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Return cached application settings."""
    return Settings()


settings = get_settings()

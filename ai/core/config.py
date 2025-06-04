"""
Core configuration for the AI service.
"""

import os
from typing import List

# For Pydantic v2, BaseSettings is in pydantic_settings
try:
    from pydantic_settings import BaseSettings
except ImportError:
    # Fallback for older versions
    from pydantic import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    # Environment
    environment: str = os.getenv("ENVIRONMENT", "development")  # API Configuration
    api_host: str = os.getenv("API_HOST", "127.0.0.1")
    api_port: int = int(os.getenv("API_PORT", "8080"))

    # CORS
    allowed_origins: List[str] = [
        "http://localhost:3000",  # Frontend dev
        "http://localhost:3001",  # Backend dev
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
        os.getenv("BACKEND_URL", "http://localhost:3001"),
    ]

    # External Services
    ollama_url: str = os.getenv("OLLAMA_URL", "http://localhost:11434")
    ollama_model: str = os.getenv("OLLAMA_MODEL", "llama3.1")

    # Database
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    postgres_url: str = os.getenv(
        "DATABASE_URL", "postgresql://user:pass@localhost/smartsocial"
    )

    # AI Model Configuration
    sentence_transformer_model: str = os.getenv(
        "SENTENCE_TRANSFORMER_MODEL", "all-MiniLM-L6-v2"
    )
    embedding_dimension: int = int(os.getenv("EMBEDDING_DIMENSION", "384"))

    # Content Filtering Thresholds
    brain_rot_threshold: float = float(os.getenv("BRAIN_ROT_THRESHOLD", "0.7"))
    quality_threshold: float = float(os.getenv("QUALITY_THRESHOLD", "0.6"))
    relevance_threshold: float = float(os.getenv("RELEVANCE_THRESHOLD", "0.5"))

    # Rate Limiting
    rate_limit_requests: int = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
    rate_limit_window: int = int(os.getenv("RATE_LIMIT_WINDOW", "3600"))  # 1 hour

    # Caching
    cache_ttl: int = int(os.getenv("CACHE_TTL", "3600"))  # 1 hour

    # Logging
    log_level: str = os.getenv("LOG_LEVEL", "INFO")

    class Config:
        env_file = ".env"


# Global settings instance
settings = Settings()

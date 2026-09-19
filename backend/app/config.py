from pathlib import Path
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parent.parent
_ROOT_DIR = _BACKEND_DIR.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(
            str(_BACKEND_DIR / ".env"),
            str(_ROOT_DIR / ".env"),
            ".env"
        ),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    PROJECT_NAME: str = "QuietMap API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"

    DATABASE_URL: str = "postgresql+psycopg://postgres.PROJECT_REF:PASSWORD@POOLER_HOST:5432/postgres?sslmode=require"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000

    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]

    DEFAULT_SAMPLING_INTERVAL: int = 10
    DEFAULT_INTERRUPTION_THRESHOLD: int = 18
    DEFAULT_ACTIVITY: str = "Work"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)


settings = Settings()

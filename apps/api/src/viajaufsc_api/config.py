"""Configuração da API carregada exclusivamente do ambiente."""

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


API_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    """Valores de execução da API, com segredos fora do controle de versão."""

    model_config = SettingsConfigDict(
        env_file=API_ROOT / ".env",
        env_prefix="VIAJAUFSC_",
        extra="ignore",
    )

    app_name: str = "viajaUFSC API"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"
    database_url: str | None = Field(default=None, repr=False)
    cors_origins: list[str] = Field(default_factory=list)


@lru_cache
def get_settings() -> Settings:
    """Retorna uma única configuração por processo."""

    return Settings()

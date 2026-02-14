"""Arvai Kernel configuration management.

Reads config.yaml at startup and injects values into environment variables.
"""

import os
from pathlib import Path
from functools import lru_cache

import yaml
from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Config schema (mirrors config.yaml)
# ---------------------------------------------------------------------------

class ServerConfig(BaseModel):
    host: str = "127.0.0.1"
    port: int = 8731
    debug: bool = False
    cors_origins: list[str] = ["http://localhost:5173"]


class DatabaseConfig(BaseModel):
    path: str = "./data/arvai.db"


class AppConfig(BaseModel):
    name: str = "Arvai Kernel"
    version: str = "0.1.0"


class Settings(BaseModel):
    server: ServerConfig = ServerConfig()
    database: DatabaseConfig = DatabaseConfig()
    app: AppConfig = AppConfig()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_CONFIG_SEARCH_PATHS = [
    Path("config.yaml"),
    Path("config.yml"),
    Path(__file__).resolve().parent.parent / "config.yaml",
]


def _find_config_file() -> Path | None:
    for p in _CONFIG_SEARCH_PATHS:
        if p.exists():
            return p.resolve()
    return None


def _flatten_dict(d: dict, prefix: str = "ARVAI") -> dict[str, str]:
    """Flatten a nested dict into `ARVAI_SECTION_KEY=value` entries."""
    items: dict[str, str] = {}
    for key, value in d.items():
        env_key = f"{prefix}_{key}".upper()
        if isinstance(value, dict):
            items.update(_flatten_dict(value, env_key))
        elif isinstance(value, list):
            items[env_key] = ",".join(str(v) for v in value)
        else:
            items[env_key] = str(value)
    return items


def _inject_env(settings: Settings) -> None:
    """Inject flattened config values into `os.environ`."""
    flat = _flatten_dict(settings.model_dump())
    for key, value in flat.items():
        os.environ.setdefault(key, value)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Load configuration from YAML file, inject into env, and return."""
    cfg_path = _find_config_file()

    if cfg_path is not None:
        with open(cfg_path, encoding="utf-8") as f:
            raw = yaml.safe_load(f) or {}
        settings = Settings.model_validate(raw)
    else:
        settings = Settings()

    _inject_env(settings)
    return settings

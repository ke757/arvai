"""LLM model adapter service.

Provides a unified factory for creating LangChain chat model instances
backed by OpenAI, DeepSeek, Qianwen (通义千问), or Ollama.
"""

import logging
from typing import Final
from langchain_core.language_models.chat_models import BaseChatModel

from app.core.config import get_settings, LLMProviderConfig

logger = logging.getLogger("arvai-kernel.llm")

# ---------------------------------------------------------------------------
# Supported providers
# ---------------------------------------------------------------------------

SUPPORTED_PROVIDERS: Final[set[str]] = {"openai", "deepseek", "qianwen", "ollama"}

# Providers that use the OpenAI-compatible API
_OPENAI_COMPATIBLE: Final[set[str]] = {"openai", "deepseek", "qianwen"}


# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------

class LLMServiceError(Exception):
    """Base exception for LLM service errors."""


class LLMConfigError(LLMServiceError):
    """Raised when LLM configuration is missing or invalid."""


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _create_openai_compatible(cfg: LLMProviderConfig) -> BaseChatModel:
    """Create a ChatOpenAI instance (works for OpenAI, DeepSeek, Qianwen)."""
    from langchain_openai import ChatOpenAI

    if not cfg.api_key:
        raise LLMConfigError("api_key is required for OpenAI-compatible providers")
    if not cfg.model:
        raise LLMConfigError("model is required")

    kwargs: dict = {
        "model": cfg.model,
        "api_key": cfg.api_key,
    }
    if cfg.base_url:
        kwargs["base_url"] = cfg.base_url

    return ChatOpenAI(**kwargs)


def _create_ollama(cfg: LLMProviderConfig) -> BaseChatModel:
    """Create a ChatOllama instance for local Ollama models."""
    from langchain_ollama import ChatOllama

    if not cfg.model:
        raise LLMConfigError("model is required for Ollama provider")

    kwargs: dict = {"model": cfg.model}
    if cfg.base_url:
        kwargs["base_url"] = cfg.base_url

    return ChatOllama(**kwargs)


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------

def create_llm(provider: str | None = None) -> BaseChatModel:
    """Create a new LLM chat model instance.

    Args:
        provider: Provider name. If *None*, uses ``active_provider`` from config.

    Returns:
        A LangChain ``BaseChatModel`` ready for ``invoke`` / ``ainvoke``.

    Raises:
        LLMConfigError: If the provider is unknown or misconfigured.
    """
    settings = get_settings()
    llm_cfg = settings.llm

    if provider is None:
        provider = llm_cfg.active_provider

    if not provider:
        raise LLMConfigError(
            "No active LLM provider configured. "
            "Set llm.active_provider in config.yaml."
        )

    if provider not in SUPPORTED_PROVIDERS:
        raise LLMConfigError(
            f"Unsupported provider '{provider}'. "
            f"Supported: {', '.join(sorted(SUPPORTED_PROVIDERS))}"
        )

    if provider not in llm_cfg.providers:
        raise LLMConfigError(
            f"Provider '{provider}' is not configured in llm.providers."
        )

    cfg = llm_cfg.providers[provider]
    logger.info("Creating LLM instance: provider=%s, model=%s", provider, cfg.model)

    if provider in _OPENAI_COMPATIBLE:
        return _create_openai_compatible(cfg)

    # ollama
    return _create_ollama(cfg)


# ---------------------------------------------------------------------------
# Singleton access
# ---------------------------------------------------------------------------

_cached_llm: BaseChatModel | None = None
_cached_provider: str | None = None


def get_llm() -> BaseChatModel:
    """Return a cached LLM instance for the active provider.

    The instance is created lazily on first call and reused afterwards.
    Call :func:`reset_llm` to force re-creation (e.g. after config change).
    """
    global _cached_llm, _cached_provider

    settings = get_settings()
    active = settings.llm.active_provider

    if _cached_llm is not None and _cached_provider == active:
        return _cached_llm

    _cached_llm = create_llm(active)
    _cached_provider = active
    return _cached_llm


def reset_llm() -> None:
    """Clear the cached LLM instance so the next :func:`get_llm` call
    creates a fresh one."""
    global _cached_llm, _cached_provider
    _cached_llm = None
    _cached_provider = None
    logger.info("LLM instance cache cleared.")

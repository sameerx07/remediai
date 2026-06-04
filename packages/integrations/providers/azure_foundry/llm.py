from __future__ import annotations

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_openai import AzureChatOpenAI
from pydantic import SecretStr


def create_chat_model(settings: object) -> BaseChatModel:
    """Create the default Azure OpenAI/Foundry chat model."""
    raw_key = getattr(settings, "azure_openai_api_key", None)
    api_key: SecretStr | None = None
    if raw_key is not None:
        if isinstance(raw_key, SecretStr):
            api_key = raw_key if raw_key.get_secret_value() else None
        elif isinstance(raw_key, str) and raw_key:
            api_key = SecretStr(raw_key)

    return AzureChatOpenAI(
        azure_endpoint=getattr(settings, "azure_openai_endpoint", ""),
        azure_deployment=getattr(settings, "azure_openai_deployment", "gpt-5.4-mini"),
        api_version=getattr(settings, "azure_openai_api_version", "2024-08-01-preview"),
        api_key=api_key,
        temperature=0,
    )

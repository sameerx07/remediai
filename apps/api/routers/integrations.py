from fastapi import APIRouter

from apps.api.core.config import get_settings
from apps.api.schemas.integrations import IntegrationsHealthResponse, IntegrationStatus
from packages.integrations.providers import (
    integration_warnings,
    is_scm_configured,
    provider_config_from_settings,
)

router = APIRouter(prefix="/api/v1/integrations", tags=["integrations"])


@router.get("/health", response_model=IntegrationsHealthResponse)
async def get_integrations_health() -> IntegrationsHealthResponse:
    settings = get_settings()
    cfg = provider_config_from_settings(settings)
    warnings = integration_warnings(settings)

    scm_configured = is_scm_configured(settings)
    scm_warning = (
        "Source control integration is not configured. "
        "Code context, PR creation, and validation are skipped."
        if not scm_configured
        else None
    )

    return IntegrationsHealthResponse(
        llm_provider_id=cfg.llm_provider_id,
        retrieval_provider_id=cfg.retrieval_provider_id,
        scm=IntegrationStatus(
            provider_id=cfg.scm_provider_id,
            configured=scm_configured,
            warning=scm_warning,
        ),
        warnings=warnings,
    )

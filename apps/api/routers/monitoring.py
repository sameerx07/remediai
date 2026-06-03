"""Post-deploy monitoring endpoints (Phase 37).

POST /api/v1/incidents/{id}/monitor  — trigger monitoring after deployment
GET  /api/v1/incidents/{id}/monitor  — retrieve monitoring result
"""

from __future__ import annotations

import uuid as _uuid
from datetime import UTC, datetime, timedelta
from uuid import UUID

import structlog
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.auth.dependencies import require_auth
from apps.api.schemas.monitoring import (
    MonitorResultResponse,
    MonitorTriggerRequest,
    MonitorTriggerResponse,
)
from packages.data_access.models.audit_log_orm import AuditLogOrm
from packages.data_access.models.incident_orm import IncidentOrm
from packages.data_access.session import get_db_session

logger = structlog.get_logger()
router = APIRouter(prefix="/api/v1/incidents", tags=["monitoring"])


@router.post(
    "/{incident_id}/monitor",
    response_model=MonitorTriggerResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def trigger_monitoring(
    incident_id: UUID,
    body: MonitorTriggerRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db_session),
    _auth: None = Depends(require_auth),
) -> MonitorTriggerResponse:
    """Trigger post-deploy monitoring for an incident.

    Returns 202 immediately; monitoring runs as a background task.
    """
    orm = await db.get(IncidentOrm, incident_id)
    if orm is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    if not getattr(orm, "pr_url", None) and not _get_pr_url(orm):
        raise HTTPException(
            status_code=409,
            detail="Incident has no PR — create and merge a PR before triggering monitoring",
        )

    if orm.monitoring_result is not None:
        raise HTTPException(
            status_code=409,
            detail="Monitoring already completed for this incident",
        )

    deployed_at = body.deployed_at or (datetime.now(UTC) - timedelta(minutes=5))

    background_tasks.add_task(
        _run_monitoring_background,
        incident_id=str(incident_id),
        exception_type=orm.exception_type,
        exception_message=orm.exception_message,
        deployed_at=deployed_at,
        monitoring_window_minutes=body.monitoring_window_minutes,
    )

    logger.info(
        "monitoring_triggered",
        incident_id=str(incident_id),
        deployed_at=deployed_at.isoformat(),
        window=body.monitoring_window_minutes,
    )

    return MonitorTriggerResponse(
        incident_id=str(incident_id),
        status="monitoring_started",
        deployed_at=deployed_at.isoformat(),
        monitoring_window_minutes=body.monitoring_window_minutes,
    )


@router.get("/{incident_id}/monitor", response_model=MonitorResultResponse)
async def get_monitoring_result(
    incident_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    _auth: None = Depends(require_auth),
) -> MonitorResultResponse:
    """Return the stored monitoring result for an incident."""
    orm = await db.get(IncidentOrm, incident_id)
    if orm is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    return MonitorResultResponse(
        incident_id=str(incident_id),
        incident_status=orm.status,
        monitoring_result=orm.monitoring_result,
    )


def _get_pr_url(orm: IncidentOrm) -> str | None:
    """Extract pr_url from work_items if available."""
    for wi in getattr(orm, "work_items", []):
        if getattr(wi, "pr_url", None):
            return str(wi.pr_url)
    return None


async def _run_monitoring_background(
    incident_id: str,
    exception_type: str,
    exception_message: str,
    deployed_at: datetime,
    monitoring_window_minutes: int,
) -> None:
    """Background task: run the monitoring agent and persist results."""
    from packages.agent_runtime.monitoring.agent import run_monitoring
    from packages.config.settings import get_settings
    from packages.data_access.session import async_session_factory
    from packages.integrations.azure_monitor.client import AzureMonitorClient
    from packages.integrations.providers.registry import (
        create_chat_model,
        ensure_valid_provider_config,
    )

    log = logger.bind(incident_id=incident_id)

    try:
        settings = get_settings()
        ensure_valid_provider_config(settings)
        llm = create_chat_model(settings)
        monitor_client = AzureMonitorClient(workspace_id=settings.azure_monitor_workspace_id)

        result, trace_entry, new_status = await run_monitoring(
            incident_id=incident_id,
            exception_type=exception_type,
            exception_message=exception_message,
            deployed_at=deployed_at,
            monitoring_window_minutes=monitoring_window_minutes,
            monitor_client=monitor_client,
            llm=llm,
        )

        async with async_session_factory() as session:
            await session.execute(
                update(IncidentOrm)
                .where(IncidentOrm.id == _uuid.UUID(incident_id))
                .values(
                    monitoring_result=result.to_dict(),
                    status=new_status,
                    updated_at=datetime.now(UTC),
                )
            )
            session.add(
                AuditLogOrm(
                    id=_uuid.uuid4(),
                    incident_id=_uuid.UUID(incident_id),
                    agent_name=trace_entry.agent_name,
                    action="monitoring_run",
                    actor_identity="system",
                    log_metadata=trace_entry.model_dump(),
                    timestamp=datetime.now(UTC),
                )
            )
            await session.commit()

        log.info("monitoring_persisted", new_status=new_status)

    except Exception as exc:
        log.error("monitoring_background_failed", error=str(exc))

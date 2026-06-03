"""Post-deploy monitoring agent (Phase 37 / Gap 6).

Triggered manually via POST /api/v1/incidents/{id}/monitor after an engineer
confirms the deployment went out. Queries Azure Monitor for exception recurrence
and error rate change, then marks the incident resolved or reopened.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from typing import Any

import structlog
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import HumanMessage, SystemMessage

from packages.domain.models.audit import AgentTraceEntry
from packages.integrations.pii_scrubber import scrub

logger = structlog.get_logger()

AGENT_NAME = "monitoring_agent"
PROMPT_VERSION = "monitoring_v1"

# Minimum improvement ratio to consider the fix successful
_IMPROVEMENT_THRESHOLD = 0.5


class MonitoringResult:
    """In-memory result from a monitoring run — serialised to JSONB on the ORM."""

    def __init__(
        self,
        deployed_at: str,
        monitoring_window_minutes: int,
        exception_reoccurred: bool,
        error_rate_before: float,
        error_rate_after: float,
        health_status: str,
        summary: str,
        checked_at: str,
    ) -> None:
        self.deployed_at = deployed_at
        self.monitoring_window_minutes = monitoring_window_minutes
        self.exception_reoccurred = exception_reoccurred
        self.error_rate_before = error_rate_before
        self.error_rate_after = error_rate_after
        self.health_status = health_status
        self.summary = summary
        self.checked_at = checked_at

    def to_dict(self) -> dict[str, Any]:
        return {
            "deployed_at": self.deployed_at,
            "monitoring_window_minutes": self.monitoring_window_minutes,
            "exception_reoccurred": self.exception_reoccurred,
            "error_rate_before": self.error_rate_before,
            "error_rate_after": self.error_rate_after,
            "health_status": self.health_status,
            "summary": self.summary,
            "checked_at": self.checked_at,
        }


def _derive_health_status(
    exception_reoccurred: bool,
    rate_before: float,
    rate_after: float,
) -> str:
    if exception_reoccurred:
        return "unhealthy"
    if rate_before == 0 and rate_after == 0:
        return "inconclusive"
    if rate_before > 0 and rate_after < rate_before * _IMPROVEMENT_THRESHOLD:
        return "healthy"
    if rate_after == 0:
        return "healthy"
    return "degraded"


async def run_monitoring(
    incident_id: str,
    exception_type: str,
    exception_message: str,
    deployed_at: datetime,
    monitoring_window_minutes: int,
    monitor_client: Any,
    llm: BaseChatModel,
) -> tuple[MonitoringResult, AgentTraceEntry, str]:
    """Run the monitoring agent and return (result, trace_entry, new_status).

    *monitor_client* is an ``AzureMonitorClient`` instance.
    *new_status* is one of: ``"resolved"`` | ``"reopened"`` | ``"analyzed"``.
    """
    import time

    start_ms = int(time.monotonic() * 1000)
    log = logger.bind(agent=AGENT_NAME, incident_id=incident_id)
    log.info("monitoring_agent_start", deployed_at=deployed_at.isoformat())

    error: str | None = None
    result: MonitoringResult | None = None
    new_status = "analyzed"

    try:
        baseline_start = deployed_at - timedelta(minutes=monitoring_window_minutes)
        baseline_end = deployed_at
        post_start = deployed_at
        post_end = deployed_at + timedelta(minutes=monitoring_window_minutes)

        # Count matching exceptions in post-deploy window
        post_events = await _count_exceptions(monitor_client, exception_type, post_start, post_end)
        # Count in baseline window for comparison
        baseline_events = await _count_exceptions(
            monitor_client, exception_type, baseline_start, baseline_end
        )

        exception_reoccurred = post_events > 0
        health_status = _derive_health_status(
            exception_reoccurred, float(baseline_events), float(post_events)
        )

        summary = await _generate_summary(
            llm=llm,
            exception_type=exception_type,
            exception_message=exception_message,
            exception_reoccurred=exception_reoccurred,
            baseline_events=baseline_events,
            post_events=post_events,
            health_status=health_status,
            window_minutes=monitoring_window_minutes,
        )

        result = MonitoringResult(
            deployed_at=deployed_at.isoformat(),
            monitoring_window_minutes=monitoring_window_minutes,
            exception_reoccurred=exception_reoccurred,
            error_rate_before=float(baseline_events),
            error_rate_after=float(post_events),
            health_status=health_status,
            summary=summary,
            checked_at=datetime.now(UTC).isoformat(),
        )

        if exception_reoccurred:
            new_status = "reopened"
        elif health_status == "healthy":
            new_status = "resolved"
        else:
            new_status = "analyzed"

        log.info(
            "monitoring_agent_complete",
            health_status=health_status,
            exception_reoccurred=exception_reoccurred,
            new_status=new_status,
        )

    except Exception as exc:
        log.error("monitoring_agent_failed", error=str(exc))
        error = str(exc)
        result = MonitoringResult(
            deployed_at=deployed_at.isoformat(),
            monitoring_window_minutes=monitoring_window_minutes,
            exception_reoccurred=False,
            error_rate_before=0.0,
            error_rate_after=0.0,
            health_status="inconclusive",
            summary=f"Monitoring failed: {exc}",
            checked_at=datetime.now(UTC).isoformat(),
        )

    latency_ms = int(time.monotonic() * 1000) - start_ms
    trace_entry = AgentTraceEntry(
        agent_name=AGENT_NAME,
        prompt_version=PROMPT_VERSION,
        input_summary=f"deployed_at={deployed_at.isoformat()}, window={monitoring_window_minutes}m",
        output_summary=f"health={result.health_status}, reoccurred={result.exception_reoccurred}, status→{new_status}",
        latency_ms=latency_ms,
        error=error,
    )

    return result, trace_entry, new_status


async def _count_exceptions(
    monitor_client: Any,
    exception_type: str,
    start: datetime,
    end: datetime,
) -> int:
    """Return count of matching exceptions in the time window, or 0 on error."""
    try:
        results = await monitor_client.fetch_exceptions_in_range(
            exception_type=exception_type,
            start=start,
            end=end,
        )
        return len(results) if results else 0
    except Exception as exc:
        logger.warning("monitoring_count_failed", error=str(exc))
        return 0


async def _generate_summary(
    llm: BaseChatModel,
    exception_type: str,
    exception_message: str,
    exception_reoccurred: bool,
    baseline_events: int,
    post_events: int,
    health_status: str,
    window_minutes: int,
) -> str:
    """Generate a 1–2 sentence human-readable monitoring summary."""
    system = (
        "You are a monitoring summary writer. "
        "Given post-deployment metrics, write 1–2 sentences describing the outcome. "
        "Be factual and concise. Return plain text only — no JSON, no markdown."
    )
    payload = json.dumps(
        {
            "exception_type": exception_type,
            "exception_message": scrub(exception_message),
            "exception_reoccurred": exception_reoccurred,
            "baseline_event_count": baseline_events,
            "post_deploy_event_count": post_events,
            "health_status": health_status,
            "monitoring_window_minutes": window_minutes,
        },
        ensure_ascii=False,
    )
    try:
        response = await llm.ainvoke([SystemMessage(content=system), HumanMessage(content=payload)])
        return str(response.content).strip()[:500]
    except Exception:
        verdict = "recurred" if exception_reoccurred else "did not recur"
        return (
            f"The exception {exception_type} {verdict} in the {window_minutes}-minute "
            f"post-deployment window. "
            f"Event count changed from {baseline_events} to {post_events}."
        )

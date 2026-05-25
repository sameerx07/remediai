"""Local-mode only endpoints — only registered when LOCAL_MODE=true.

POST /api/v1/local/ingest  — accepts bridge-detected exceptions, creates incidents
GET  /api/v1/local/logs    — returns recent container log lines from Redis
"""

from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import Any

import redis.asyncio as aioredis
import structlog
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.core.config import get_settings
from packages.data_access.models.incident_orm import IncidentOrm
from packages.data_access.session import get_db_session
from packages.domain.models.incident import Incident

logger = structlog.get_logger()

router = APIRouter(prefix="/api/v1/local", tags=["local-dev"])

_REDIS_LOG_KEY = "local:logs"


class LocalIngestPayload(BaseModel):
    container: str
    exception_type: str
    exception_message: str
    stack_trace: str = ""
    source: str = "local-docker"


class IngestResponse(BaseModel):
    status: str
    incident_id: str | None = None


class LogLine(BaseModel):
    ts: str
    container: str
    line: str
    level: str = "INFO"
    is_exception: bool = False
    incident_id: str | None = None


async def _get_redis() -> Any:
    settings = get_settings()
    return aioredis.from_url(settings.redis_url, decode_responses=True)  # type: ignore[no-untyped-call]


@router.post("/ingest", response_model=IngestResponse)
async def ingest_local_exception(
    payload: LocalIngestPayload,
    db: AsyncSession = Depends(get_db_session),
) -> IngestResponse:
    incident = Incident(
        source=payload.source,
        exception_type=payload.exception_type,
        exception_message=payload.exception_message,
        stack_trace=payload.stack_trace or None,
        raw_payload={
            "container": payload.container,
            "source": payload.source,
            "ingested_at": datetime.now(UTC).isoformat(),
        },
    )

    existing = await db.scalar(
        select(IncidentOrm).where(IncidentOrm.fingerprint == incident.fingerprint)
    )
    if existing is not None:
        logger.debug(
            "local_ingest_duplicate",
            fingerprint=incident.fingerprint,
            exception_type=payload.exception_type,
        )
        return IngestResponse(status="duplicate", incident_id=None)

    now = datetime.now(UTC)
    orm = IncidentOrm(
        id=incident.id,
        correlation_id=incident.correlation_id,
        source=incident.source,
        exception_type=incident.exception_type,
        exception_message=incident.exception_message,
        stack_trace=incident.stack_trace,
        fingerprint=incident.fingerprint,
        priority=incident.priority.value,
        status=incident.status.value,
        raw_payload=incident.raw_payload,
        created_at=now,
        updated_at=now,
    )
    db.add(orm)
    await db.commit()

    logger.info(
        "local_ingest_created",
        incident_id=str(incident.id),
        exception_type=payload.exception_type,
        container=payload.container,
    )
    return IngestResponse(status="created", incident_id=str(incident.id))


@router.get("/logs", response_model=list[LogLine])
async def get_local_logs(
    container: str | None = None,
    limit: int = 200,
) -> list[LogLine]:
    if limit > 500:
        raise HTTPException(status_code=400, detail="limit must be ≤ 500")

    redis_client = await _get_redis()
    try:
        raw_entries: list[str] = await redis_client.lrange(_REDIS_LOG_KEY, 0, _REDIS_MAX_FETCH - 1)
    finally:
        await redis_client.aclose()

    lines: list[LogLine] = []
    for raw in raw_entries:
        try:
            data: dict[str, Any] = json.loads(raw)
            entry = LogLine(
                ts=str(data.get("ts", "")),
                container=str(data.get("container", "")),
                line=str(data.get("line", "")),
                level=str(data.get("level", "INFO")),
                is_exception=bool(data.get("is_exception", False)),
                incident_id=str(data["incident_id"]) if data.get("incident_id") else None,
            )
            if container and entry.container != container:
                continue
            lines.append(entry)
        except (json.JSONDecodeError, KeyError):
            continue

        if len(lines) >= limit:
            break

    return lines


_REDIS_MAX_FETCH = 1000


class ThrowResponse(BaseModel):
    status: str
    marker: str


@router.get("/dev/throw", response_model=ThrowResponse)
async def dev_throw_exception(marker: str = "test-local-exception") -> ThrowResponse:
    """Deliberately raise a ValueError so the log-bridge can detect it from container stdout.

    The exception bubbles up to uvicorn's error handler, which prints the full
    Python traceback to stderr — Docker captures this as container log output.
    The log-bridge tails that output, detects the traceback, and calls
    POST /api/v1/local/ingest to create an incident.

    Only registered when LOCAL_MODE=true. Never deploy to production.
    """
    logger.info("dev_throw_triggered", marker=marker)
    raise ValueError(f"local-bridge-test: {marker}")

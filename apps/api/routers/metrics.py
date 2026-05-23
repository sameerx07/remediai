from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.schemas.metrics import MetricsResponse, PriorityCount, StatusCount, TopError
from packages.data_access.models.incident_orm import IncidentOrm
from packages.data_access.session import get_db_session

router = APIRouter(prefix="/api/v1/metrics", tags=["metrics"])


@router.get("", response_model=MetricsResponse)
async def get_metrics(db: AsyncSession = Depends(get_db_session)) -> MetricsResponse:
    total_result = await db.execute(select(func.count()).select_from(IncidentOrm))
    total_incidents: int = total_result.scalar_one()

    analyzed_result = await db.execute(
        select(func.count()).select_from(IncidentOrm).where(IncidentOrm.status == "analyzed")
    )
    total_analyzed: int = analyzed_result.scalar_one()

    status_rows = await db.execute(
        select(IncidentOrm.status, func.count().label("count")).group_by(IncidentOrm.status)
    )
    by_status = [StatusCount(status=row[0], count=row[1]) for row in status_rows.all()]

    priority_rows = await db.execute(
        select(IncidentOrm.priority, func.count().label("count")).group_by(IncidentOrm.priority)
    )
    by_priority = [PriorityCount(priority=row[0], count=row[1]) for row in priority_rows.all()]

    top_error_rows = await db.execute(
        select(IncidentOrm.exception_type, func.count().label("count"))
        .group_by(IncidentOrm.exception_type)
        .order_by(func.count().desc())
        .limit(10)
    )
    top_errors = [TopError(exception_type=row[0], count=row[1]) for row in top_error_rows.all()]

    return MetricsResponse(
        total_incidents=total_incidents,
        total_analyzed=total_analyzed,
        by_status=by_status,
        by_priority=by_priority,
        top_errors=top_errors,
    )

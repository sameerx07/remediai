from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class MonitorTriggerRequest(BaseModel):
    deployed_at: datetime | None = Field(
        default=None,
        description="When the deployment completed. Defaults to 5 minutes ago if omitted.",
    )
    monitoring_window_minutes: int = Field(
        default=30,
        ge=5,
        le=120,
        description="How many minutes to observe after deployment.",
    )


class MonitorTriggerResponse(BaseModel):
    incident_id: str
    status: str  # "monitoring_started"
    deployed_at: str
    monitoring_window_minutes: int


class MonitorResultResponse(BaseModel):
    incident_id: str
    incident_status: str
    monitoring_result: dict[str, Any] | None

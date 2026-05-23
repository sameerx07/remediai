from __future__ import annotations

from pydantic import BaseModel


class StatusCount(BaseModel):
    status: str
    count: int


class PriorityCount(BaseModel):
    priority: str
    count: int


class TopError(BaseModel):
    exception_type: str
    count: int


class MetricsResponse(BaseModel):
    total_incidents: int
    total_analyzed: int
    by_status: list[StatusCount]
    by_priority: list[PriorityCount]
    top_errors: list[TopError]

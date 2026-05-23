from datetime import UTC, datetime
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class IncidentEvent(BaseModel):
    """Service Bus message body published when a new incident is persisted."""

    incident_id: UUID
    correlation_id: UUID
    source: str
    exception_type: str
    exception_message: str
    fingerprint: str
    priority: str
    status: str
    published_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    event_id: UUID = Field(default_factory=uuid4)

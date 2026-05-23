# Phase 5 — Ingestion Service & Service Bus Publisher

## Objective

Wire the Azure Monitor connector (Phase 4) into a production-ready ingestion loop: a
scheduled poller that fetches new exceptions, persists them, and publishes
`IncidentEvent` messages to the Azure Service Bus `incident-events` topic so the Agent
Worker can pick them up.

---

## Files to Create

| Path | Purpose |
|------|---------|
| `packages/domain/models/events.py` | `IncidentEvent` — the Service Bus message body model |
| `packages/integrations/service_bus/__init__.py` | Re-exports `ServiceBusPublisher` |
| `packages/integrations/service_bus/publisher.py` | `ServiceBusPublisher` — async topic sender with retry |
| `apps/worker/ingestion/scheduler.py` | `IngestionScheduler` — orchestrates poll → persist → publish |
| `apps/worker/main.py` | Async worker entry-point; runs the scheduler loop |
| `tests/unit/test_incident_event.py` | Unit tests for `IncidentEvent` serialisation |
| `tests/integration/test_service_bus_publisher.py` | Publisher tests with mock SB sender |
| `tests/integration/test_ingestion_scheduler.py` | Scheduler tests with mocked connector + publisher |

## Files to Modify

| Path | Change |
|------|--------|
| `packages/domain/models/__init__.py` | Export `IncidentEvent` |
| `packages/integrations/__init__.py` | Re-export `ServiceBusPublisher` |
| `apps/api/core/config.py` | Add `servicebus_fqdn` computed property |
| `ROADMAP.md` | Check off Service Bus publisher and ingestion service milestone items |

---

## Dependencies

All already declared in `pyproject.toml`:
- `azure-servicebus = "^7.12"` — `ServiceBusClient` (async)
- `azure-identity = "^1.17"` — `DefaultAzureCredential`
- `pydantic = "^2.7"` — `IncidentEvent` model + JSON serialisation

---

## Implementation Notes

### IncidentEvent (Service Bus message body)

```python
class IncidentEvent(BaseModel):
    incident_id: UUID
    correlation_id: UUID
    source: str
    exception_type: str
    exception_message: str
    fingerprint: str
    priority: str        # IncidentPriority value
    status: str          # IncidentStatus value
    published_at: datetime
```

The message body is `model_dump_json()`. Service Bus metadata:
- `message_id`: `str(incident_id)` — deduplication key
- `subject`: `"incident.new"`
- Application properties: `source`, `priority` — enable subscription filters

### ServiceBusPublisher

- Wraps `azure.servicebus.aio.ServiceBusClient` with `DefaultAzureCredential`.
- FQDN computed as `{namespace}.servicebus.windows.net`.
- `publish_incident(event)` — sends a single `ServiceBusMessage`.
- `publish_batch(events)` — sends a `ServiceBusMessageBatch` for throughput.
- Async context manager (`async with ServiceBusPublisher(...) as pub:`).
- `HttpResponseError` and `ServiceBusError` logged and re-raised.

### IngestionScheduler

Single-run method + infinite poll loop:

```python
class IngestionScheduler:
    async def run_once(self) -> list[IncidentEvent]
    async def run_forever(self) -> None  # asyncio.sleep between runs
```

`run_once` flow:
1. Open an async DB session.
2. Create `AzureMonitorClient(workspace_id)`.
3. Create `IngestionConnector(session, monitor_client)`.
4. Call `connector.run(lookback_minutes)` → list of new `Incident` objects.
5. Convert each to `IncidentEvent`.
6. Publish batch via `ServiceBusPublisher`.
7. Commit the DB session.
8. Return the list of events.

`run_forever` wraps `run_once` in a `try/except` so transient errors (network, Azure
API) do not crash the worker. Errors are logged; the loop sleeps
`ingestion_poll_interval_seconds` between runs regardless of success or failure.

### Worker Entry-point (`apps/worker/main.py`)

```python
async def main() -> None:
    configure_logging()
    scheduler = IngestionScheduler(settings=get_settings(), session_factory=...)
    await scheduler.run_forever()
```

Uses `asyncio.run(main())` so it can be launched as:
```
poetry run python -m apps.worker.main
```

### Error Handling

- Transient Azure errors (network, throttling): caught in `run_forever`, logged, loop continues.
- Fatal config errors (missing workspace ID): raise at startup before entering the loop.
- DB errors: session is rolled back; loop continues.

---

## Acceptance Criteria

- [ ] `pytest tests/unit/test_incident_event.py -v` — all pass
- [ ] `pytest tests/integration/test_service_bus_publisher.py -v` — all pass
- [ ] `pytest tests/integration/test_ingestion_scheduler.py -v` — all pass
- [ ] `ruff check packages/integrations/service_bus/ apps/worker/` — no errors
- [ ] `mypy packages/integrations/service_bus/ apps/worker/ --strict` — 0 errors
- [ ] `IncidentEvent.model_dump_json()` round-trips through `IncidentEvent.model_validate_json()`
- [ ] Publisher sets `message_id` from `incident_id`
- [ ] Scheduler commits session only after successful publish

---

## Commit Message

```
feat(worker): add Service Bus publisher, IngestionScheduler, and worker entry-point
```

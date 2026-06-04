# Phase 5 - Ingestion Service

## Goal

Define and enforce the canonical ingestion flow that creates new incidents and feeds the agent pipeline.

This phase establishes:
- scheduled Azure Monitor ingestion into PostgreSQL
- deduplication and persistence behavior for incoming incidents
- local-mode polling behavior for pipeline execution
- generic API exception intake endpoints for webhook and manual uploads

## Deliverables

### 1) Worker ingestion structure contract

The ingestion and worker runtime structure is:

```text
apps/worker/
├── main.py
├── ingestion/
│   ├── connector.py
│   └── scheduler.py
└── agents/
    ├── runner.py
    └── local_poller.py
```

### 2) Ingestion connector contract

File: apps/worker/ingestion/connector.py

Class: IngestionConnector
- Depends on AsyncSession and AzureMonitorClient.
- Provides run(lookback_minutes: int = 10) -> list[Incident].

Behavior contract:
- Fetch incidents from Azure Monitor client.
- Deduplicate by incidents.fingerprint against PostgreSQL.
- Detect exception language before persistence.
- Persist only new incidents as IncidentOrm rows.
- Flush session when new incidents exist.
- Return only newly created Incident objects.

Data mapping contract:
- Incident domain model values map to IncidentOrm fields.
- Priority and status are persisted as enum string values.
- exception_language is persisted on incident rows.

### 3) Ingestion scheduler contract

File: apps/worker/ingestion/scheduler.py

Class: IngestionScheduler
- run_once() -> list[Incident]
- run_forever() -> None

run_once contract:
- Open DB session.
- Open AzureMonitorClient with configured workspace.
- Run ingestion connector with ingestion_lookback_minutes.
- Commit on success.
- Roll back and re-raise on failure.
- Return newly created incidents.

run_forever contract:
- Execute run_once in an infinite loop.
- Catch and log cycle failures.
- Sleep using ingestion_poll_interval_seconds between cycles.

### 4) Worker entrypoint and local-mode contract

File: apps/worker/main.py

Runtime contract:
- Configure worker logging on startup.
- Route execution based on local_mode setting:
  - local_mode=false: run IngestionScheduler.run_forever()
  - local_mode=true: run LocalIncidentPoller.run_forever()

File: apps/worker/agents/local_poller.py

Class: LocalIncidentPoller
- run_once() -> int
- run_forever() -> None

Behavior contract:
- Poll incidents where status=new OR (status=analyzed AND approval_status=approved).
- Process incidents in bounded batches.
- Execute pipeline through AgentPipelineRunner.
- Commit each successful incident run.
- Roll back and continue when an incident run fails.

### 5) Generic exception intake API contract

Files:
- apps/api/routers/exceptions.py
- apps/api/schemas/exception_intake.py

Endpoints:
- POST /api/v1/exceptions/ingest
- POST /api/v1/exceptions/upload

Payload contract:
- exception_type
- exception_message
- stack_trace
- source
- application_name
- environment
- language

Response contract:
- status: created | duplicate
- incident_id: string | null

Persistence contract:
- Construct Incident domain model from payload.
- Deduplicate using fingerprint against incidents table.
- Persist IncidentOrm row when not duplicate.
- Commit transaction for created incidents.

Security contract:
- Both endpoints require API authentication dependency.
- Endpoints are always registered in the FastAPI app.

### 6) Configuration contract

Settings consumed by this phase:
- azure_monitor_workspace_id
- ingestion_poll_interval_seconds
- ingestion_lookback_minutes
- local_mode
- local_incident_poll_interval_seconds

## Security Touchpoints

- Ingestion flow does not store secrets in code.
- Intake endpoints enforce authentication before incident creation.
- Deduplication prevents repeated incident amplification from duplicate payloads.
- Worker loops are failure-tolerant and continue without unsafe crash loops.
- Incident persistence follows existing governance path through auditable status transitions.

## Acceptance Criteria

- python -c "from apps.worker.ingestion.scheduler import IngestionScheduler; print('OK')" prints OK.
- python -c "from apps.worker.agents.local_poller import LocalIncidentPoller; print('OK')" prints OK.
- python -c "from apps.api.routers.exceptions import router; print('OK')" prints OK.
- pytest tests/integration/test_ingestion_scheduler.py -v executes successfully.
- pytest tests/unit/test_exception_intake_router.py -v executes successfully.
- ruff check apps/worker/ apps/api/routers/exceptions.py apps/api/schemas/exception_intake.py exits 0.
- mypy apps/worker/ apps/api/routers/exceptions.py apps/api/schemas/exception_intake.py --strict exits 0.

## Out of Scope

- External message broker publishing and queue fan-out design.
- Non-PostgreSQL queue orchestration for pipeline triggering.
- Advanced ingestion backpressure strategies beyond poll interval and dedupe.
- Provider-specific ingestion connectors outside Azure Monitor for this phase.

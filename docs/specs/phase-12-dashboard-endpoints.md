# Phase 12 - FastAPI Dashboard Endpoints

## Goal

Define the canonical FastAPI endpoint contract consumed by the dashboard for
incident review, metrics, integration visibility, and monitoring target
selection.

This phase establishes:
- paginated incident list and incident detail APIs
- aggregate metrics for dashboard charts and stat cards
- integration health visibility for dashboard warnings
- persisted and discovered monitoring target APIs with local and Kubernetes
  environment support

## Deliverables

### 1) Router surface contract

The dashboard endpoint router surface is:

```text
apps/api/routers/
├── incidents.py
├── metrics.py
├── integrations.py
└── targets.py
```

The response model surface is:

```text
apps/api/schemas/
├── incident.py
├── metrics.py
├── integrations.py
└── targets.py
```

### 2) Incident list endpoint contract

Files:
- apps/api/routers/incidents.py
- apps/api/schemas/incident.py

Route:
- `GET /api/v1/incidents`

Query parameters:
- page: int = 1, minimum 1
- page_size: int = 20, minimum 1, maximum 100
- status: str | None
- priority: str | None
- date_from: datetime | None
- date_to: datetime | None

Response contract:
- `PaginatedResponse[IncidentListItem]`

`IncidentListItem` fields:
- id
- exception_type
- exception_message
- priority
- status
- created_at
- updated_at
- has_analysis
- pr_url

Behavior contract:
- Results are ordered by `created_at` descending.
- `has_analysis` is derived by a secondary query over `AnalysisOrm.incident_id`.
- List responses expose `pr_url`, not a legacy external work-item URL field.

### 3) Incident detail endpoint contract

Files:
- apps/api/routers/incidents.py
- apps/api/schemas/incident.py

Route:
- `GET /api/v1/incidents/{incident_id}`

Response contract:
- `IncidentDetail`

`IncidentDetail` fields include:
- all primary incident identity and status fields
- stack_trace
- root_cause
- root_cause_json
- recommendations
- code_snippets
- rag_results
- agent_trace
- approval_status
- approved_by
- approved_at
- approved_recommendation_rank
- pr_url
- pr_branch

Behavior contract:
- The endpoint loads `IncidentOrm` with `analyses` via `selectinload`.
- If no analysis exists, root cause and analysis arrays return empty or null
  values.
- The endpoint does not return `work_items` as part of the current canonical
  response shape.
- Unknown incident IDs return HTTP 404.

### 4) Integration health endpoint contract

Files:
- apps/api/routers/integrations.py
- apps/api/schemas/integrations.py

Route:
- `GET /api/v1/integrations/health`

Response contract:
- `IntegrationsHealthResponse`

Fields:
- llm_provider_id: str
- retrieval_provider_id: str
- scm: IntegrationStatus
- warnings: list[str]

`IntegrationStatus` fields:
- provider_id
- configured
- warning

Behavior contract:
- The endpoint returns SCM integration status and aggregated warnings.
- The current response shape does not include a separate `ticketing` object.

### 5) Metrics endpoint contract

Files:
- apps/api/routers/metrics.py
- apps/api/schemas/metrics.py

Route:
- `GET /api/v1/metrics`

Response contract:
- `MetricsResponse`

Fields:
- total_incidents
- total_analyzed
- by_status: list[StatusCount]
- by_priority: list[PriorityCount]
- top_errors: list[TopError]

Behavior contract:
- `total_analyzed` counts incidents where `status == "analyzed"`.
- `by_status` and `by_priority` are grouped database aggregations.
- `top_errors` is grouped by `exception_type`, ordered descending by count, and
  limited to 10 entries.

### 6) Monitoring targets endpoint contract

Files:
- apps/api/routers/targets.py
- apps/api/schemas/targets.py

Routes:
- `GET /api/v1/targets`
- `PUT /api/v1/targets`
- `GET /api/v1/targets/discovered`

Shared environment contract:
- environment: `local | kubernetes`

`GET /api/v1/targets` contract:
- Query parameters:
  - environment: defaults to `local`
  - enabled_only: defaults to `false`
- Response: `list[MonitorTarget]`

`MonitorTarget` fields:
- id
- environment
- target_type
- target_key
- display_name
- enabled
- metadata
- created_at
- updated_at

`PUT /api/v1/targets` contract:
- Request: `UpsertMonitorTargetsRequest`
- Response: `UpsertMonitorTargetsResponse`
- `updated` returns the number of created or updated target rows.

`GET /api/v1/targets/discovered` contract:
- Query parameter:
  - environment: defaults to `local`
- Response: `list[DiscoveredTarget]`

Discovery behavior contract:
- `local` discovery returns deduplicated container names from
  `bridge_containers`.
- `kubernetes` discovery returns namespace and workload targets derived from
  `kubernetes_discovery_namespaces` and `kubernetes_discovery_workloads`.

Authorization contract:
- Target routes depend on `_require_targets_access`.
- When `local_mode` is true, target routes are accessible without the admin
  header.
- When `local_mode` is false, target routes require
  `X-Remediai-Admin-Token` matching `target_api_token`.

## Security Touchpoints

- Dashboard data endpoints use dependency-injected database sessions rather than
  direct database access from the client.
- Target management endpoints enforce an admin token outside local mode.
- Integration health exposes configuration state and warnings, not secrets.
- Incident detail exposes approval and PR metadata but not write capabilities.

## Acceptance Criteria

- `python -c "from apps.api.routers.incidents import list_incidents, get_incident; print('OK')"` prints `OK`.
- `python -c "from apps.api.routers.metrics import get_metrics; from apps.api.routers.integrations import get_integrations_health; from apps.api.routers.targets import list_targets, upsert_targets, discover_targets; print('OK')"` prints `OK`.
- `python -c "from apps.api.schemas.incident import IncidentListItem, IncidentDetail; from apps.api.schemas.metrics import MetricsResponse; from apps.api.schemas.integrations import IntegrationsHealthResponse; from apps.api.schemas.targets import MonitorTarget, DiscoveredTarget, UpsertMonitorTargetsRequest; print('OK')"` prints `OK`.
- `pytest tests/unit/test_incidents_router.py -v` executes successfully.
- `pytest tests/unit/test_metrics_router.py -v` executes successfully.
- `pytest tests/unit/test_integrations_router.py -v` executes successfully.
- `pytest tests/unit/test_targets_router.py -v` executes successfully.

## Out of Scope

- Dashboard rendering and client-side UI composition.
- Approval and rejection write endpoints.
- Post-deploy monitoring trigger and result endpoints.
- Legacy work-item response shapes no longer returned by the current incident
  API contract.

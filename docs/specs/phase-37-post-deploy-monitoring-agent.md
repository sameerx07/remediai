# Phase 37 — Post-Deploy Monitoring Agent

## Goal

Close the remediation feedback loop: after a fix is deployed, a monitoring
agent queries Azure Monitor to determine whether the original exception
recurred, whether the error rate improved, and whether the deployment
introduced any new exceptions. The incident is marked `resolved` or
`reopened` based on the findings.

**Scope (Gap 6):** Manual trigger only. The Deployment Agent (Gap 5) is
deferred — instead, an engineer calls a single API endpoint after confirming
the deployment went out. This is the same human-in-the-loop pattern used by
the approval gate.

---

## Trigger

```
POST /api/v1/incidents/{incident_id}/monitor
```

**Request body:**
```json
{
  "deployed_at": "2026-06-03T10:30:00Z",
  "monitoring_window_minutes": 30
}
```

- `deployed_at` — ISO-8601 timestamp of when the deployment completed
  (engineer provides this; defaults to "now minus 5 minutes" if omitted)
- `monitoring_window_minutes` — how long to watch after deployment
  (default 30, max 120)

The endpoint runs the monitoring agent as a FastAPI `BackgroundTask` so it
returns immediately with `202 Accepted` and the agent runs asynchronously.

---

## Agent Logic

```
1. Validate: incident must have pr_url set (PR was created).
2. Load original exception_type and fingerprint from incident.
3. Query Azure Monitor for the original exception_type in the window
   [deployed_at, deployed_at + monitoring_window_minutes].
4. Query Azure Monitor for error rate in the same service in:
      baseline window: [deployed_at - monitoring_window_minutes, deployed_at]
      post-deploy window: [deployed_at, deployed_at + monitoring_window_minutes]
5. Build MonitoringResult:
      exception_reoccurred = any matching events found in step 3
      error_rate_before    = event count in baseline window
      error_rate_after     = event count in post-deploy window
      health_status        = derive from reoccurrence + rate change
      summary              = human-readable LLM-generated summary
6. Persist MonitoringResult.
7. Update incident status:
      exception_reoccurred=True  → status = "reopened"
      error_rate_after < error_rate_before × 0.5 and no recurrence → status = "resolved"
      otherwise → status = "analyzed" (inconclusive — human reviews)
8. Append AgentTraceEntry to audit_log.
```

---

## New Files

```
packages/agent_runtime/monitoring/
├── __init__.py
└── agent.py                    — make_monitoring_agent()

apps/api/routers/monitoring.py  — POST /api/v1/incidents/{id}/monitor
apps/api/schemas/monitoring.py  — MonitorTriggerRequest, MonitorResultResponse
tests/unit/test_monitoring_agent.py
```

## Modified Files

```
packages/domain/models/agent_state.py  — add monitoring_result field
packages/data_access/models/incident_orm.py  — add monitoring_result JSONB column
alembic/versions/0004_monitoring_result.py   — migration
apps/api/main.py                             — register monitoring router
ROADMAP.md                                   — Phase 37 entry
```

---

## Data Model

`monitoring_result` stored as JSONB on the `incidents` table (no separate
table — monitoring is 1:1 with an incident).

```python
class MonitoringResult(BaseModel):
    deployed_at: str                  # ISO-8601
    monitoring_window_minutes: int
    exception_reoccurred: bool
    error_rate_before: float          # events per window
    error_rate_after: float
    health_status: str                # "healthy" | "degraded" | "inconclusive"
    summary: str                      # LLM-generated 1-2 sentence summary
    checked_at: str                   # ISO-8601
```

`health_status` derivation:
- `healthy` — no recurrence AND `error_rate_after < error_rate_before × 0.5`
- `degraded` — no recurrence BUT error rate did not improve significantly
- `inconclusive` — Azure Monitor returned no data (service may not be reporting)

---

## API Endpoints

### `POST /api/v1/incidents/{incident_id}/monitor`

Trigger post-deploy monitoring for an approved incident.

**Guards:**
- 404 if incident not found
- 409 if incident does not have `pr_url` set (PR must exist before monitoring)
- 409 if monitoring already completed (`monitoring_result` already set)

**Response `202`:**
```json
{
  "incident_id": "...",
  "status": "monitoring_started",
  "deployed_at": "2026-06-03T10:30:00Z",
  "monitoring_window_minutes": 30
}
```

### `GET /api/v1/incidents/{incident_id}/monitor`

Return the stored monitoring result for an incident.

**Response `200`:**
```json
{
  "incident_id": "...",
  "monitoring_result": { ... },
  "incident_status": "resolved"
}
```

---

## Security Touchpoints

- LLM call: `scrub()` applied to exception message before building summary prompt.
- `AgentTraceEntry` written on every execution path.
- No new credentials — reuses the existing `AzureMonitorClient`.
- Endpoint requires `require_auth()` (same as all other routes).

---

## Acceptance Criteria

- `ruff check .` and `mypy apps/ packages/ --strict` pass.
- All existing tests continue to pass.
- `POST /api/v1/incidents/{id}/monitor` returns 202 for an incident with `pr_url` set.
- `POST /api/v1/incidents/{id}/monitor` returns 409 for an incident without `pr_url`.
- Monitoring agent sets `incident.monitoring_result` in the database.
- Incident status changes to `resolved` when no recurrence and rate improved.
- Incident status changes to `reopened` when exception reoccurred.
- Agent trace entry written for every run path.

---

## Out of Scope

- Automatic trigger from CI/CD pipeline (requires Gap 5 — Deployment Agent).
- Rollback recommendation (future).
- Grafana / Loki monitoring (Phase 27+).

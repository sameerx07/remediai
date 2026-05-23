# Phase 12 — FastAPI Dashboard Endpoints

## Goal

Expose incident data via REST API for the React dashboard. Three endpoints: list, detail, and metrics.

## Endpoints

### `GET /api/v1/incidents`

Paginated incident list with optional filters.

**Query parameters:**

| Param | Type | Default | Constraint |
|---|---|---|---|
| `page` | int | 1 | ≥ 1 |
| `page_size` | int | 20 | 1–100 |
| `status` | str | — | optional filter |
| `priority` | str | — | optional filter |
| `date_from` | datetime | — | ISO 8601 |
| `date_to` | datetime | — | ISO 8601 |

**Response:** `PaginatedResponse[IncidentListItem]`

```json
{
  "items": [...],
  "total": 42,
  "page": 1,
  "page_size": 20,
  "pages": 3
}
```

**`IncidentListItem` fields:** `id`, `exception_type`, `exception_message`, `priority`, `status`, `created_at`, `updated_at`, `has_analysis`, `ado_bug_url`

---

### `GET /api/v1/incidents/{id}`

Full incident detail including analysis and work items.

**Response:** `IncidentDetail`

Includes: all list fields + `stack_trace`, `root_cause`, `root_cause_json`, `recommendations`, `code_snippets`, `rag_results`, `agent_trace`, `work_items`.

Returns **404** if incident not found.

---

### `GET /api/v1/metrics`

Aggregate counts for the dashboard metrics panel.

**Response:** `MetricsResponse`

```json
{
  "total_incidents": 100,
  "total_analyzed": 73,
  "by_status": [{"status": "analyzed", "count": 73}, ...],
  "by_priority": [{"priority": "high", "count": 40}, ...],
  "top_errors": [{"exception_type": "System.NullReferenceException", "count": 28}, ...]
}
```

Top errors capped at 10, ordered by count descending.

## Implementation Notes

- All endpoints use `AsyncSession` via `Depends(get_db_session)` for DB access
- `selectinload` used for `analyses` and `work_items` relationships (avoids N+1)
- `has_analysis` derived with a secondary query on `incident_analyses.incident_id`
- B008 ruff rule suppressed globally — FastAPI's `Query`/`Depends` in defaults is idiomatic

## Files

```
apps/api/
├── main.py                       — router registration
├── routers/
│   ├── incidents.py              — list + detail endpoints
│   └── metrics.py                — metrics endpoint
└── schemas/
    ├── incident.py               — PaginatedResponse, IncidentListItem, IncidentDetail
    └── metrics.py                — MetricsResponse, StatusCount, PriorityCount, TopError

docs/specs/phase-12-dashboard-endpoints.md
tests/unit/test_incidents_router.py
tests/unit/test_metrics_router.py
```

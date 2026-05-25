---
id: api
title: API Reference
sidebar_label: API Reference
---

# API Reference

The RemediAI Backend API is a FastAPI application exposing REST endpoints for the dashboard and external consumers. The full OpenAPI spec is available at `/openapi.json` when the API is running.

---

## Base URL

| Environment | URL |
|-------------|-----|
| Local development | `http://localhost:8000` |
| Production | Configured via `DASHBOARD_BASE_URL` |

---

## Authentication

| Method | Description |
|--------|-------------|
| Azure AD Bearer token | Preferred for production. Pass `Authorization: Bearer <token>` |
| API key | Pass `X-API-Key: <key>` for service-to-service calls |

Public endpoints: `/health`, `/api/v1/incidents/inject` (internal only, IP-restricted).

---

## Incidents

### List incidents

```http
GET /api/v1/incidents
```

Query parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status (`new`, `triaging`, `analyzed`, `bug_created`, `pr_created`, `resolved`, `analysis_failed`) |
| `priority` | string | Filter by priority (`critical`, `high`, `medium`, `low`) |
| `source` | string | Filter by application source |
| `from_date` | ISO8601 | Created after this date |
| `to_date` | ISO8601 | Created before this date |
| `page` | int | Page number (default: `1`) |
| `page_size` | int | Items per page (default: `50`, max: `200`) |

Response:

```json
{
  "total": 142,
  "page": 1,
  "page_size": 50,
  "items": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "source": "MyApp.Api",
      "exception_type": "System.NullReferenceException",
      "exception_message": "Object reference not set to an instance of an object.",
      "priority": "high",
      "status": "bug_created",
      "created_at": "2026-05-25T10:00:00Z",
      "updated_at": "2026-05-25T10:02:45Z"
    }
  ]
}
```

---

### Get incident detail

```http
GET /api/v1/incidents/{incident_id}
```

Response includes the full analysis, code snippets, recommendations, and work item link:

```json
{
  "id": "3fa85f64-...",
  "source": "MyApp.Api",
  "exception_type": "System.NullReferenceException",
  "exception_message": "Object reference not set...",
  "priority": "high",
  "status": "bug_created",
  "triage_labels": ["null-reference", "service:user-api"],
  "root_cause_summary": "A NullReferenceException was thrown in UserService.GetById...",
  "root_cause_json": { "component": "UserService.GetById", "confidence": 0.91, ... },
  "recommendations": [ { "rank": 1, "title": "Add null guard...", "confidence": 0.93 } ],
  "code_snippets": [ { "file_path": "/src/Services/UserService.cs", ... } ],
  "ado_bug_id": 12345,
  "ado_bug_url": "https://dev.azure.com/...",
  "pr_url": null,
  "created_at": "2026-05-25T10:00:00Z",
  "updated_at": "2026-05-25T10:02:45Z"
}
```

---

### Inject a test incident

```http
POST /api/v1/incidents/inject
Content-Type: application/json
```

Body:

```json
{
  "source": "MyApp.Api",
  "exception_type": "System.NullReferenceException",
  "exception_message": "Object reference not set to an instance of an object.",
  "stack_trace": "   at MyApp.Services.UserService.GetById(Guid id) in /src/Services/UserService.cs:line 42",
  "raw_payload": { "environment": "staging" }
}
```

Response: `201 Created` with `{ "incident_id": "...", "status": "new" }`

---

### Approve a recommendation

```http
POST /api/v1/incidents/{incident_id}/approve
Content-Type: application/json
Authorization: Bearer <token>
```

Body:

```json
{
  "recommendation_rank": 1
}
```

Response: `200 OK` with `{ "status": "approval_recorded", "pr_agent_queued": true }`

---

### Get audit log for an incident

```http
GET /api/v1/incidents/{incident_id}/audit
```

Response:

```json
{
  "incident_id": "3fa85f64-...",
  "entries": [
    {
      "agent_name": "triage",
      "action": "triage_completed",
      "output_summary": "priority=high labels=[null-reference]",
      "created_at": "2026-05-25T10:00:02Z"
    }
  ]
}
```

---

## Metrics

### Summary metrics

```http
GET /api/v1/metrics/summary
```

Query parameters: `from_date`, `to_date`

Response:

```json
{
  "total_incidents": 142,
  "by_status": {
    "new": 3,
    "triaging": 1,
    "analyzed": 5,
    "bug_created": 98,
    "pr_created": 12,
    "resolved": 21,
    "analysis_failed": 2
  },
  "by_priority": {
    "critical": 4,
    "high": 67,
    "medium": 55,
    "low": 16
  },
  "mean_triage_time_seconds": 165,
  "top_exception_types": [
    { "exception_type": "System.NullReferenceException", "count": 34 },
    { "exception_type": "System.TimeoutException", "count": 18 }
  ]
}
```

---

## Health

```http
GET /health
```

Response: `200 OK`

```json
{
  "status": "ok",
  "version": "0.4.0",
  "db": "ok",
  "redis": "ok",
  "service_bus": "ok"
}
```

---

## Interactive docs

When the API is running, interactive Swagger UI is available at:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
- **OpenAPI JSON:** `http://localhost:8000/openapi.json`

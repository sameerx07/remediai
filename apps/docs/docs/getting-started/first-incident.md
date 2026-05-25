---
sidebar_position: 3
title: Your First Incident
---

# Your First Incident

This guide walks through triggering a complete end-to-end pipeline run and observing the results in the dashboard.

---

## Option A — Inject a sample incident via API

The easiest way to test without a live Application Insights source is to inject a synthetic incident directly through the API:

```bash
curl -X POST http://localhost:8000/api/v1/incidents/inject \
  -H "Content-Type: application/json" \
  -d '{
    "source": "MyApp.Api",
    "exception_type": "System.NullReferenceException",
    "exception_message": "Object reference not set to an instance of an object.",
    "stack_trace": "   at MyApp.Services.UserService.GetById(Guid id) in /src/Services/UserService.cs:line 42\n   at MyApp.Controllers.UsersController.Get(Guid id) in /src/Controllers/UsersController.cs:line 18",
    "raw_payload": {
      "environment": "staging",
      "service": "user-api",
      "severity": "Error"
    }
  }'
```

The API returns the new incident ID:

```json
{
  "incident_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "new",
  "message": "Incident created and queued for analysis."
}
```

---

## Option B — Real Application Insights exception

If your .NET application is connected to Application Insights, simply trigger an unhandled exception in your application. The ingestion service polls on the `INGESTION_POLL_INTERVAL` schedule (default: 60 seconds) and will pick it up automatically.

---

## Watching the pipeline run

### 1. Watch worker logs

```bash
make local-logs
```

You should see structured log output for each agent:

```json
{"event": "agent_started", "agent_name": "triage", "incident_id": "3fa85f64...", "timestamp": "2026-05-25T10:01:00Z"}
{"event": "agent_completed", "agent_name": "triage", "incident_id": "3fa85f64...", "priority": "high", "labels": ["null-reference"], "latency_ms": 1240}
{"event": "agent_started", "agent_name": "root_cause", "incident_id": "3fa85f64..."}
{"event": "agent_completed", "agent_name": "root_cause", "incident_id": "3fa85f64...", "component": "UserService.GetById", "confidence": 0.91}
...
{"event": "bug_created", "ado_bug_id": 12345, "ado_bug_url": "https://dev.azure.com/..."}
{"event": "pipeline_completed", "incident_id": "3fa85f64...", "status": "bug_created", "total_latency_ms": 47300}
```

### 2. Check the incident via API

```bash
curl http://localhost:8000/api/v1/incidents/3fa85f64-5717-4562-b3fc-2c963f66afa6 | python -m json.tool
```

Once the pipeline completes the status should be `bug_created`:

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "bug_created",
  "priority": "high",
  "triage_labels": ["null-reference"],
  "root_cause_summary": "A NullReferenceException was thrown in UserService.GetById at line 42 because the database query returned null and the result was not checked before dereferencing. The likely fix is to add a null guard before accessing the returned object.",
  "recommendations": [
    {
      "rank": 1,
      "title": "Add null check before accessing user object",
      "confidence": 0.91,
      "affected_files": ["/src/Services/UserService.cs"]
    }
  ],
  "ado_bug_id": 12345,
  "ado_bug_url": "https://dev.azure.com/..."
}
```

### 3. Open the dashboard

Navigate to `http://localhost:5173`. You should see:

- The incident in the **Incidents** list with a `bug_created` status badge.
- The **Detail view** showing the root cause summary, code snippets, and ranked recommendations.
- The **Azure DevOps Bug** link.
- An **Approve Recommendation** button to trigger the PR Agent (Phase 2).

---

## Approving a recommendation and creating a PR

1. Open the incident detail view in the dashboard.
2. Click **Approve** next to the top-ranked recommendation.
3. Confirm the approval in the modal.
4. Watch the worker logs — the PR Agent will create a branch and draft PR:

```json
{"event": "pr_created", "pr_branch": "remedia/3fa85f64/1", "pr_url": "https://dev.azure.com/.../pullrequest/99"}
```

5. The incident status updates to `pr_created` and the PR URL appears in the detail view.

:::warning Human review required
The draft PR is tagged for review in Azure DevOps. RemediAI never sets auto-complete. A human engineer must review and merge the PR.
:::

---

## Acceptance checklist

After your first run, verify:

- [ ] Incident created with correct `exception_type` and `status`
- [ ] `triage_labels` match the exception type (e.g. `null-reference`)
- [ ] `root_cause_summary` references the correct method and file
- [ ] `code_snippets` contains the relevant lines from your repo
- [ ] `ado_bug_id` is set and the Bug exists in Azure DevOps Boards
- [ ] Incident and analysis visible in the React dashboard
- [ ] Audit log entries written (check `audit_log` table in PostgreSQL)

---

## Next steps

- [Architecture overview](../architecture/overview) — understand how the components fit together
- [Agent pipeline](../agents/pipeline) — deep-dive into each agent's logic
- [Configuration reference](../configuration) — tune the ingestion interval, batch size, and more

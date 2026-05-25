---
sidebar_position: 4
title: Audit Log
---

# Audit Log

The `audit_log` table is an **append-only, immutable record** of every agent action taken by RemediAI. It exists to satisfy enterprise AI governance requirements — every automated decision must be traceable, reviewable, and explainable.

---

## What is logged

Every agent appends at least one entry to the audit log:

| Agent | Actions logged |
|-------|---------------|
| Triage | `triage_started`, `triage_completed`, `pii_scrubbed` |
| Root Cause | `root_cause_started`, `root_cause_completed` |
| Code Context | `code_context_started`, `code_context_completed` |
| RAG Retrieval | `rag_retrieval_started`, `rag_retrieval_completed` |
| Fix Planner | `fix_planner_started`, `fix_planner_completed` |
| Bug Creation | `bug_creation_started`, `bug_created` |
| PR Agent | `approval_received`, `branch_created`, `pr_created` |
| Validation | `validation_started`, `validation_completed` |
| Ingestion | `incident_ingested`, `duplicate_skipped`, `pii_scrubbed` |

---

## Table schema

```sql
CREATE TABLE audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id     UUID REFERENCES incidents(id),
    agent_name      TEXT NOT NULL,
    action          TEXT NOT NULL,
    input_summary   TEXT,
    output_summary  TEXT,
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

| Column | Description |
|--------|-------------|
| `id` | Immutable UUID |
| `incident_id` | Linked incident (nullable for system events) |
| `agent_name` | Which agent or service produced this entry |
| `action` | What happened (verb_noun format) |
| `input_summary` | Scrubbed summary of inputs — never raw PII |
| `output_summary` | Summary of what the agent decided or produced |
| `metadata` | Structured data: model version, prompt version, token count, latency, pattern hits |
| `created_at` | Write timestamp — immutable |

---

## Example entries

```json
[
  {
    "id": "a1b2c3d4-...",
    "incident_id": "3fa85f64-...",
    "agent_name": "ingestion",
    "action": "pii_scrubbed",
    "input_summary": "Processing exception NullReferenceException from MyApp.Api",
    "output_summary": "Scrubbed 1 EMAIL from exception_message",
    "metadata": { "fields_scrubbed": ["exception_message"], "pattern_hits": { "EMAIL": 1 } },
    "created_at": "2026-05-25T10:00:01Z"
  },
  {
    "id": "b2c3d4e5-...",
    "incident_id": "3fa85f64-...",
    "agent_name": "triage",
    "action": "triage_completed",
    "input_summary": "NullReferenceException in UserService.GetById",
    "output_summary": "priority=high labels=[null-reference, service:user-api]",
    "metadata": {
      "llm_model": "gpt-4o",
      "prompt_version": "triage_v1",
      "tokens_used": 312,
      "latency_ms": 1240
    },
    "created_at": "2026-05-25T10:00:02Z"
  },
  {
    "id": "c3d4e5f6-...",
    "incident_id": "3fa85f64-...",
    "agent_name": "bug_creation",
    "action": "bug_created",
    "input_summary": "Creating Bug for incident 3fa85f64",
    "output_summary": "Created ADO Bug #12345",
    "metadata": { "ado_bug_id": 12345, "ado_project": "MyApp" },
    "created_at": "2026-05-25T10:01:15Z"
  }
]
```

---

## Immutability enforcement

- The `audit_log` table is created with `created_at DEFAULT now()` — no `updated_at` column.
- Application service accounts have `INSERT` permission only — no `UPDATE` or `DELETE`.
- The Terraform module applies a PostgreSQL row-level security policy to enforce this at the database level.

```sql
-- Applied by Terraform during provisioning
CREATE POLICY audit_log_insert_only ON audit_log
    FOR ALL
    TO remediai_worker, remediai_api
    USING (false)
    WITH CHECK (true);

GRANT INSERT ON audit_log TO remediai_worker;
GRANT INSERT ON audit_log TO remediai_api;
GRANT SELECT ON audit_log TO remediai_api;  -- dashboard reads only
```

---

## Querying the audit log

### Via the dashboard

The React dashboard exposes a filtered audit log view on each incident's detail page. Platform engineers can see every agent action for a given incident.

### Via API

```http
GET /api/v1/incidents/{incident_id}/audit
Authorization: Bearer <token>
```

Response:

```json
{
  "incident_id": "3fa85f64-...",
  "entries": [
    { "agent_name": "ingestion", "action": "pii_scrubbed", ... },
    { "agent_name": "triage", "action": "triage_completed", ... },
    ...
  ]
}
```

### Via SQL (for auditors)

```sql
SELECT
    al.created_at,
    al.agent_name,
    al.action,
    al.output_summary,
    al.metadata->>'prompt_version' AS prompt_version,
    al.metadata->>'llm_model' AS model
FROM audit_log al
WHERE al.incident_id = '3fa85f64-5717-4562-b3fc-2c963f66afa6'
ORDER BY al.created_at;
```

---

## Retention

Audit log rows are retained for **3 years** per the data retention policy. A PostgreSQL partitioning strategy (by month) enables efficient purging of entries older than the retention period without full table scans.

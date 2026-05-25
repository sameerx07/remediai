---
sidebar_position: 2
title: Data Flow
---

# Data Flow

This page traces a single exception from Application Insights through to an Azure DevOps Bug and (optionally) a draft pull request.

---

## End-to-end sequence

```mermaid
sequenceDiagram
    participant App as .NET Application
    participant AI as Application Insights
    participant Ing as Log Ingestion Service
    participant SB as Azure Service Bus
    participant AW as Agent Worker
    participant OAI as Azure OpenAI
    participant ADO as Azure DevOps
    participant PG as PostgreSQL
    participant API as Backend API
    participant UI as React Dashboard

    App->>AI: Unhandled exception logged
    Ing->>AI: KQL query (every N seconds)
    AI-->>Ing: Exception records
    Ing->>Ing: Fingerprint + deduplicate
    Ing->>PG: Upsert incident (status=new)
    Ing->>SB: Publish IncidentEvent

    SB-->>AW: Dequeue IncidentEvent
    AW->>PG: Mark status=triaging

    Note over AW: Triage Agent
    AW->>OAI: Triage prompt
    OAI-->>AW: Priority + labels
    AW->>PG: Write triage results + audit

    Note over AW: Root Cause Agent
    AW->>OAI: Root cause prompt
    OAI-->>AW: Structured root cause JSON
    AW->>PG: Write analysis + audit

    Note over AW: Code Context Agent
    AW->>ADO: Fetch source files (read-only)
    ADO-->>AW: Code snippets
    AW->>PG: Write code_snippets + audit

    Note over AW: RAG Retrieval Agent
    AW->>ADO: Query Azure AI Search
    ADO-->>AW: Top K results
    AW->>PG: Write rag_results + audit

    Note over AW: Fix Planner Agent
    AW->>OAI: Fix planner prompt
    OAI-->>AW: Ranked recommendations
    AW->>PG: Write recommendations + audit

    Note over AW: Bug Creation Agent
    AW->>ADO: Create Bug work item
    ADO-->>AW: Bug ID + URL
    AW->>PG: Write work_item + mark status=bug_created

    UI->>API: GET /incidents
    API->>PG: Query incidents
    PG-->>API: Incident list
    API-->>UI: Incidents + analyses

    Note over UI,AW: Human approves recommendation
    UI->>API: POST /incidents/{id}/approve
    API->>SB: Publish ApprovalEvent
    SB-->>AW: Dequeue ApprovalEvent

    Note over AW: PR Agent
    AW->>ADO: Create branch + apply patch + create draft PR
    ADO-->>AW: PR URL
    AW->>PG: Write pr_url + mark status=pr_created
```

---

## Message contracts

### `IncidentEvent` (Service Bus message)

```json
{
  "incident_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "correlation_id": "7d3f9a12-...",
  "source": "MyApp.Api",
  "exception_type": "System.NullReferenceException",
  "exception_message": "Object reference not set to an instance of an object.",
  "stack_trace": "   at MyApp.Services.UserService.GetById...",
  "raw_payload": { "environment": "production", "severity": "Error" },
  "timestamp": "2026-05-25T10:00:00Z"
}
```

### `ApprovalEvent` (Service Bus message)

```json
{
  "incident_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "recommendation_rank": 1,
  "approved_by": "user@example.com",
  "approved_at": "2026-05-25T10:05:00Z"
}
```

---

## Incident status lifecycle

```mermaid
stateDiagram-v2
    [*] --> new : Ingestion upserts incident
    new --> triaging : Agent Worker dequeues
    triaging --> analyzed : All agents complete
    analyzed --> bug_created : Bug Creation Agent succeeds
    bug_created --> pr_created : PR Agent runs after approval
    pr_created --> resolved : Human merges PR
    triaging --> analysis_failed : Any blocking agent fails
    analysis_failed --> [*]
    resolved --> [*]
```

---

## Deduplication logic

The ingestion service computes a fingerprint for each exception:

```python
fingerprint = sha256(f"{exception_type}::{normalized_stack_trace}").hexdigest()
```

Where `normalized_stack_trace` strips line numbers, memory addresses, and timestamps so that the same logical exception from different deployments produces the same fingerprint.

On each poll cycle, exceptions with a known fingerprint in `status != resolved` are skipped — preventing duplicate incidents for the same recurring error.

---

## PII scrubbing in the flow

Before any exception payload is passed to Azure OpenAI:

1. `pii_scrubber.scrub()` runs on `exception_message` and `stack_trace`.
2. Emails → `[EMAIL]`, IPs → `[IP]`, UUIDs matching user ID patterns → `[USER_ID]`, SAS tokens → `[REDACTED]`.
3. The scrubbed text (not the original) is stored in PostgreSQL and sent to the LLM.
4. The scrubbing operation is recorded in the audit log.

See [PII Scrubbing](../security/pii-scrubbing) for the full pattern list.

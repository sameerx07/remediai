---
sidebar_position: 3
title: Root Cause Agent
---

# Root Cause Agent

The Root Cause Agent analyzes the exception type, message, stack trace, and triage labels to produce a structured root cause summary.

---

## Responsibility

- Identify the most likely faulty component, method, or service.
- Produce a 2–4 sentence human-readable root cause summary.
- Produce a structured JSON breakdown with a confidence score.
- Store the full reasoning chain in `agent_trace` for auditability.

---

## Input fields

| Field | Source |
|-------|--------|
| `exception_type` | Incident |
| `exception_message` | PII-scrubbed |
| `stack_trace` | PII-scrubbed |
| `triage_labels` | Triage Agent output |

---

## Output fields

| Field | Type | Description |
|-------|------|-------------|
| `root_cause_summary` | `str` | Human-readable 2–4 sentence summary |
| `root_cause_json` | `dict` | Structured breakdown (see below) |

---

## `root_cause_json` schema

```json
{
  "component": "UserService.GetById",
  "likely_cause": "Unhandled null return from database query",
  "contributing_factors": [
    "Missing null check after repository call",
    "No defensive coding pattern applied to nullable return types"
  ],
  "confidence": 0.87
}
```

| Field | Description |
|-------|-------------|
| `component` | The class/method/service identified as the fault origin |
| `likely_cause` | One-sentence root cause |
| `contributing_factors` | List of 1–3 contributing issues |
| `confidence` | 0.0–1.0 confidence score |

---

## Logic

```
1. Parse stack trace — identify the top 5 significant frames.
   Skip: Microsoft.*, System.*, Azure.* (framework internals).
   Keep: application namespace frames only.

2. Call LLM with root cause prompt, providing:
   - exception_type
   - exception_message (scrubbed)
   - top 5 application stack frames (scrubbed)
   - triage_labels from previous agent

3. Parse structured JSON from LLM response.
   Validate against root_cause_json schema.

4. Append AgentTraceEntry to state["agent_trace"].
```

---

## LLM prompt

Prompt file: `docs/prompts/root_cause_v1.md`

The prompt instructs the model to:
- Reason step-by-step through the stack frames.
- Identify the originating application frame (not framework code).
- Return a JSON object matching the `root_cause_json` schema.
- Assign `confidence < 0.6` if the stack trace is ambiguous or truncated.

---

## Example output

```json
{
  "root_cause_summary": "A NullReferenceException was thrown in UserService.GetById at line 42 because the database query returned null and the result was dereferenced without a null check. The repository pattern used does not enforce non-null returns, allowing this to propagate unchecked.",

  "root_cause_json": {
    "component": "UserService.GetById",
    "likely_cause": "Repository returned null; no null guard applied before property access",
    "contributing_factors": [
      "Missing null check after repository call",
      "No nullable return type enforcement at the repository layer"
    ],
    "confidence": 0.91
  }
}
```

---

## Blocking agent

The Root Cause Agent is a **blocking agent**. If it fails (e.g. LLM timeout, malformed JSON response), the pipeline marks the incident `analysis_failed` and stops. The incident is logged for manual review.

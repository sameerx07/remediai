---
sidebar_position: 2
title: Triage Agent
---

# Triage Agent

The Triage Agent is the first agent in the pipeline. It assigns a priority, semantic labels, and an optional incident group to the incoming exception.

---

## Responsibility

- Assign priority (`critical / high / medium / low`) based on exception frequency, exception type, and affected service.
- Apply semantic labels such as `null-reference`, `timeout`, `authentication`, `database`, `http-client`.
- Group related incidents by setting `group_id` to an existing open incident's ID if a similar fingerprint pattern is detected.

---

## Input fields

| Field | Source |
|-------|--------|
| `exception_type` | From Application Insights / injected incident |
| `exception_message` | PII-scrubbed exception message |
| `stack_trace` | PII-scrubbed stack trace |
| `raw_payload` | Full Application Insights record (environment, severity, etc.) |

---

## Output fields

| Field | Type | Description |
|-------|------|-------------|
| `priority` | `critical \| high \| medium \| low` | Assigned priority |
| `triage_labels` | `list[str]` | e.g. `["null-reference", "service:user-api"]` |
| `group_id` | `UUID \| None` | ID of an existing open incident group |

---

## Logic

```
1. Apply rule-based pattern matching for known exception types:
   - NullReferenceException        → null-reference label, high priority
   - TimeoutException              → timeout label, high priority
   - AuthenticationException       → authentication label, critical priority
   - DbUpdateException             → database label, high priority
   - HttpRequestException          → http-client label, medium priority

2. If no rule matched, call LLM with triage prompt to assign
   priority and additional labels.

3. Query open incidents for similar fingerprints to determine
   grouping. If an open incident with the same exception_type
   and a fingerprint similarity > 0.85 exists, set group_id.

4. Write AgentTraceEntry to state["agent_trace"].
```

---

## LLM prompt

Prompt file: `docs/prompts/triage_v1.md`

The prompt instructs the model to:
- Return a JSON object with `priority` and `labels`.
- Assign `critical` only for authentication failures or data loss scenarios.
- Assign `high` for service-impacting errors affecting multiple users.
- Assign `medium` for isolated errors or low-frequency exceptions.
- Assign `low` for warnings or non-blocking issues.

---

## Example output

```json
{
  "priority": "high",
  "triage_labels": ["null-reference", "service:user-api"],
  "group_id": null
}
```

---

## PII note

The Triage Agent calls `scrub()` on `exception_message` and `stack_trace` before passing them to the LLM. The original values are never transmitted to Azure OpenAI.

---

## Audit entry

```json
{
  "agent_name": "triage",
  "prompt_version": "triage_v1",
  "input_summary": "NullReferenceException in UserService.GetById",
  "output_summary": "priority=high labels=[null-reference, service:user-api]",
  "llm_model": "gpt-4o",
  "tokens_used": 312,
  "latency_ms": 1240,
  "timestamp": "2026-05-25T10:01:01Z",
  "error": null
}
```

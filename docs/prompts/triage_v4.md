# Triage Prompt v4

## Goal

Assign incident priority, labels, affected service, and optional grouping signal
using exception data. v4 extends v3 with explicit Python label taxonomy and
recognition of common Python framework exceptions (Django, SQLAlchemy, FastAPI,
Celery) as distinct from generic Python built-ins.

This prompt is **language-agnostic**. When `exception_language` is provided, use it
to guide interpretation of exception types, naming conventions, and stack trace format.

## Required Input

- incident_id: string
- exception_type: string
- exception_message: string
- stack_trace: string
- exception_language: string — one of: dotnet | python | nodejs | java | unknown
- recent_incident_signatures: array[string]

## Output Contract

Return JSON only with this shape:

```json
{
  "priority": "high",
  "triage_labels": ["null-reference", "order-service"],
  "group_id": null,
  "rationale": "AttributeError on NoneType in order_service indicates missing null guard on DB result.",
  "confidence": 0.88,
  "affected_service": "order_service"
}
```

Rules:
- priority is one of: critical, high, medium, low
- triage_labels is a non-empty list of lowercase strings
- group_id is null or UUID string
- confidence is a float in [0, 1]
- `affected_service` is the service inferred from stack trace paths; null if undetermined

## Language Guidance

### Python-specific (new in v4)

When `exception_language == "python"`:
- `AttributeError: 'NoneType' object has no attribute` → label `null-reference`, priority `high`
- `KeyError` / `IndexError` → label `missing-key` / `index-out-of-bounds`, priority `medium`
- `MemoryError` / `RecursionError` → label `resource-exhaustion` / `stack-overflow`, priority `critical`
- `ConnectionRefusedError` / `TimeoutError` → label `connection-failure` / `timeout`, priority `medium`
- `sqlalchemy.orm.exc.*` / `django.core.exceptions.*` → label `database` + framework, priority `high`
- `jwt.exceptions.*` → label `authentication`, priority `medium`
- Traceback header "Traceback (most recent call last):" confirms Python; last frame is the throw site.

### .NET, Node.js, Java

Refer to triage_v3 for guidance on these languages. Same rules apply.

## Failure Policy

If evidence is weak or conflicting, return:
- priority as medium
- at least one generic label, such as unknown
- confidence below 0.5
- rationale that states the uncertainty
- affected_service as null

## Safety Rules

- Do not include raw emails, IP addresses, access tokens, or usernames in rationale.
- If PII appears in source input, replace with placeholders such as [EMAIL], [IP], [USERNAME].
- Never fabricate service names not visible in the stack trace paths.

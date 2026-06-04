# Triage Prompt v3

## Goal

Assign incident priority, labels, affected service, and optional grouping signal
using exception data. v3 adds `exception_language` as an explicit input field so
the model can apply language-appropriate reasoning without guessing from stack
trace format alone.

This prompt is **language-agnostic**. It handles .NET, Python, Node.js, Java, and any
other language. When `exception_language` is provided, use it to guide interpretation
of exception types, naming conventions, and stack trace structure.

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
  "rationale": "NullReferenceException in OrderService indicates missing null guard on repository result.",
  "confidence": 0.88,
  "affected_service": "OrderService"
}
```

Rules:
- priority is one of: critical, high, medium, low
- triage_labels is a non-empty list of lowercase strings
- group_id is null or UUID string
- confidence is a float in [0, 1]
- `affected_service` is the top-level service inferred from stack trace file paths; null if undetermined. Examples by language:
  - dotnet: `src/services/OrderService.cs` → `OrderService`
  - python: `src/services/order_service.py` → `order_service`
  - nodejs: `src/services/OrderService.ts` → `OrderService`
  - java: `src/main/java/com/example/services/OrderService.java` → `OrderService`

## Language Guidance

When `exception_language` is provided, apply these interpretations:

- **dotnet**: PascalCase exception types ending in `Exception`. System.* / Microsoft.* prefixes are framework-internal. Priority signals: `NullReferenceException` → high, `OutOfMemoryException` → critical.
- **python**: snake_case modules, CamelCase exception types without dots for built-ins (e.g. `AttributeError`, `KeyError`). Framework paths (`site-packages/`) are internal. `AttributeError: 'NoneType'` → treat as null-reference.
- **nodejs**: V8 stack frames with `at method (file.js:line:col)`. `node_modules/` frames are framework-internal. `UnhandledPromiseRejection` and `TypeError: Cannot read properties` are high priority.
- **java**: Fully-qualified class names (`com.example.`). `java.*` / `org.springframework.*` are framework-internal. `NullPointerException` → high, `OutOfMemoryError` → critical.
- **unknown**: Reason from available evidence without language assumptions.

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

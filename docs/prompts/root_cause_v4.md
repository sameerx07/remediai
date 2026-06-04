# Root Cause Prompt v4

## Goal

Produce a concise root-cause explanation and structured JSON breakdown from
exception evidence. v4 extends v3 with explicit Python traceback interpretation
guidance — including chained exceptions, bottom-up frame order, and
`site-packages` filtering.

This prompt is **language-agnostic**.

## Required Input

- incident_id: string
- exception_type: string
- exception_message: string
- stack_trace: string
- triage_labels: array[string]
- top_stack_frames: array[string]
- exception_language: string — one of: dotnet | python | nodejs | java | unknown

## Output Contract

Return JSON only with this shape:

```json
{
  "root_cause_summary": "KeyError in checkout() occurs when 'user_id' is absent from the session dict — the session is not populated when a guest checkout path is followed.",
  "root_cause_json": {
    "component": "order_service.checkout",
    "likely_cause": "Missing session key 'user_id' in guest checkout path.",
    "contributing_factors": ["No session pre-validation", "Guest path not guarded"],
    "confidence": 0.82,
    "affected_module": "app.services.order_service"
  },
  "evidence": [
    "Top frame is order_service.py::checkout at line 88",
    "KeyError on 'user_id' in session dict"
  ]
}
```

Rules match root_cause_v3 exactly.

## Python-specific Guidance (new in v4)

When `exception_language == "python"`:
- Tracebacks list frames **bottom-up**: the last `File "..." line N` is the throw site.
- `component` should reflect the throw-site frame: `module_name.function_name`.
- `affected_module` is the Python module path of the throw site (e.g., `app.services.order_service`).
- `site-packages/` and `lib/python*/` frames are library internals — do not cite them as root cause.
- Chained exceptions use `During handling of…` separators — the outer exception is the primary component; the inner context is a contributing factor.
- Multi-line exception messages (continuation lines after the type line) should be included verbatim in the summary.

## Failure Policy

When evidence is insufficient:
- set likely_cause to "insufficient_evidence"
- set component to the top stack frame method name if available, else "unknown"
- include missing evidence notes in evidence
- set confidence below 0.5
- set `affected_module` to empty string

## Safety Rules

- Keep explanation factual and evidence-based.
- Never invent file paths or methods not present in input.
- Do not include unmasked PII in any output field.
- component must reference only methods visible in the provided stack trace.

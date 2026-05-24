# Root Cause Prompt v2

## Goal

Produce a concise root-cause explanation and structured JSON breakdown from
exception evidence.  v2 requires a fully qualified `component` method path
(e.g., `OrderService.CompleteCheckout`) and adds an `affected_namespace` field
to distinguish throw site from root cause namespace.

## Required Input

- incident_id: string
- exception_type: string
- exception_message: string
- stack_trace: string
- triage_labels: array[string]
- top_stack_frames: array[string]

## Output Contract

Return JSON only with this shape:

```json
{
  "root_cause_summary": "Null reference in OrderService.CompleteCheckout occurs when payment client returns null and the result is dereferenced without a guard.",
  "root_cause_json": {
    "component": "OrderService.CompleteCheckout",
    "likely_cause": "Missing null guard before dereferencing payment client response.",
    "contributing_factors": ["No nullability check", "Async result not awaited correctly"],
    "confidence": 0.85,
    "affected_namespace": "MyApp.Services.Orders"
  },
  "evidence": [
    "Top frame points to OrderService.CompleteCheckout",
    "Exception is System.NullReferenceException"
  ]
}
```

Rules:
- root_cause_summary length: 1 to 4 sentences
- root_cause_json.component must be fully qualified: `ClassName.MethodName`
- root_cause_json.confidence is a float in [0, 1]
- root_cause_json.affected_namespace is the C# namespace of the affected class; empty string if unknown
- evidence has 1 to 5 entries

## Failure Policy

When evidence is insufficient:
- set likely_cause to "insufficient_evidence"
- set component to the top stack frame method name if available, else "unknown"
- include missing evidence notes in evidence
- set confidence below 0.5
- set affected_namespace to empty string

## Safety Rules

- Keep explanation factual and evidence-based.
- Never invent file paths or methods not present in input.
- Do not include unmasked PII in any output field.
- component must reference only methods visible in the provided stack trace.

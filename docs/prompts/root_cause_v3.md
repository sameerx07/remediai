# Root Cause Prompt v3

## Goal

Produce a concise root-cause explanation and structured JSON breakdown from
exception evidence. v3 adds `exception_language` as an explicit input field and
extends `component` format guidance to all supported languages. When language is
known, use it to interpret stack trace format and naming conventions precisely.

This prompt is **language-agnostic**. It handles .NET, Python, Node.js, Java, and any
other language.

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
  "root_cause_summary": "Null reference in OrderService.completeCheckout occurs when the payment client returns null and the result is dereferenced without a guard.",
  "root_cause_json": {
    "component": "OrderService.completeCheckout",
    "likely_cause": "Missing null guard before dereferencing payment client response.",
    "contributing_factors": ["No nullability check", "Async result not awaited correctly"],
    "confidence": 0.85,
    "affected_module": "app.services.orders"
  },
  "evidence": [
    "Top frame points to OrderService.completeCheckout",
    "Exception type indicates a null dereference"
  ]
}
```

Rules:
- `root_cause_summary`: 1 to 4 sentences
- `root_cause_json.component`: fully qualified method path in the language's native format:
  - dotnet: `ClassName.MethodName`
  - python: `module.ClassName.method_name` or `function_name`
  - nodejs: `ClassName.methodName` or `functionName`
  - java: `com.example.ClassName.methodName`
- `root_cause_json.confidence`: float in [0, 1]
- `root_cause_json.affected_module`: the module/namespace/package of the affected component (C# namespace, Python module path, Java package, Node.js file path without extension); empty string if unknown
- `evidence`: 1 to 5 entries

## Language Guidance

When `exception_language` is provided, apply these interpretations:

- **dotnet**: Stack frames use `at Namespace.Class.Method(params) in File.cs:line N`. `System.*` / `Microsoft.*` are framework-internal. Prioritise the first user-namespace frame.
- **python**: Traceback unwinds bottom-up; last frame shown is the throw site. `File "path.py", line N, in func`. `site-packages/` paths are library internals.
- **nodejs**: V8 frames use `at method (file.js:line:col)`. `node_modules/` is framework-internal. TypeScript source-mapped paths (`.ts`) are canonical.
- **java**: Frames use `at com.example.Class.method(File.java:N)`. `java.*` / `org.springframework.*` are framework-internal.
- **unknown**: Reason from available evidence without language assumptions.

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

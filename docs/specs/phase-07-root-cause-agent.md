# Phase 7 - Root Cause Agent

## Goal

Define and enforce the canonical Root Cause Agent contract in the LangGraph analysis pipeline.

This phase establishes:
- language-aware stack frame parsing
- LLM-based root cause analysis output contracts
- optional source-control context enrichment (recent commits and dependency snapshot)
- audit-trace and failure-safe behavior for root-cause execution

## Deliverables

### 1) Root cause package structure contract

The root cause package structure is:

```text
packages/agent_runtime/root_cause/
├── __init__.py
├── agent.py
├── models.py
├── prompt.py
└── stack_parser.py
```

### 2) Root cause model contract

File: packages/agent_runtime/root_cause/models.py

Model: RootCauseJson
- component: str
- likely_cause: str
- contributing_factors: list[str] (default empty)
- confidence: float (clamped to [0, 1])
- affected_namespace: str (default empty)

Model: RootCauseOutput
- root_cause_summary: str
- root_cause_json: RootCauseJson
- evidence: list[str] (default empty)

### 3) Prompt loading contract

File: packages/agent_runtime/root_cause/prompt.py

Prompt contract:
- Root cause prompt is loaded through prompt registry.
- Prompt key: root_cause
- Prompt version: 3

### 4) Stack parser contract

File: packages/agent_runtime/root_cause/stack_parser.py

Parser contract:
- parse_stack_frames(stack_trace: str, max_frames: int = 5) -> list[StackFrame]
- Supports .NET, Python, Node.js/V8, and Java frame formats.
- Applies language-specific internal framework filtering via language_internals registry.
- Returns user-code frames first.
- Falls back to parsed frames when all detected frames are framework/internal.
- Limits output to max_frames.

StackFrame contract:
- method: str
- file_path: str | None
- line_number: int | None
- is_user_code: bool
- language: str

Path normalization contract:
- Parser strips known container/build path prefixes for repo-relative matching when possible.

### 5) Root cause node runtime contract

File: packages/agent_runtime/root_cause/agent.py

Factory contract:
- make_root_cause_node(llm, ado_client=None, settings=None)

Input fields read from IncidentState:
- incident_id
- exception_type
- exception_message
- stack_trace
- triage_labels
- exception_language

Output fields written to IncidentState:
- root_cause_summary
- root_cause_json
- recent_commits
- dependency_context
- agent_trace (append)
- errors (append on failure)

Execution contract:
- Always executes LLM root-cause path.
- Builds top stack frames from parser output.
- Applies PII scrubbing to exception_message and stack_trace before LLM payload construction.
- Emits trace entry with agent_name root_cause and prompt version root_cause_v3.

Default failure contract:
- On LLM failure, returns deterministic fallback output:
  - root_cause_summary indicates manual review required
  - root_cause_json.likely_cause is insufficient_evidence
  - root_cause_json.confidence is 0.0
- Pipeline continues.

### 6) Optional source-control enrichment contract

File: packages/agent_runtime/root_cause/agent.py

When ADO client is available:
- Fetch recent commits for up to 2 affected files.
- Fetch dependency snapshot candidates from repo root:
  - requirements.txt
  - pyproject.toml
  - package.json
  - pom.xml
- Truncate dependency content snippets to bounded size.
- Persist enriched context to IncidentState fields:
  - recent_commits
  - dependency_context

When ADO client is unavailable or fetch fails:
- Root cause analysis continues without enrichment.

### 7) Pipeline integration contract

File: packages/agent_runtime/pipeline.py

Graph placement contract:
- root_cause node executes after triage and before code_context.

Canonical sequence segment:
- triage -> root_cause -> code_context

## Security Touchpoints

- Root-cause LLM payload uses scrubbed exception text fields.
- Source-control enrichment reads repository metadata/content only; no write operations.
- Failures degrade safely with deterministic fallback output.
- Agent trace entries preserve auditability for each root-cause execution.

## Acceptance Criteria

- python -c "from packages.agent_runtime.root_cause.agent import make_root_cause_node; print('OK')" prints OK.
- python -c "from packages.agent_runtime.root_cause.stack_parser import parse_stack_frames; print('OK')" prints OK.
- pytest tests/unit/test_stack_parser.py -v executes successfully.
- pytest tests/unit/test_root_cause_agent.py -v executes successfully.
- ruff check packages/agent_runtime/root_cause/ exits 0.
- mypy packages/agent_runtime/root_cause/ --strict exits 0.

## Out of Scope

- Rule-based replacement for root-cause LLM reasoning.
- Automatic remediation generation or code patch writing.
- Source-control provider write actions.
- Non-stack-trace telemetry correlation beyond provided incident state context.

# Phase 2 - Domain Models

## Goal

Define and enforce the canonical domain model layer for RemediAI using Pydantic v2 models and TypedDict state contracts under packages/domain.

This phase establishes a single shared source of truth for:
- incident representation
- analysis outputs
- audit and trace records
- pipeline state shape
- ingestion event payload shape
- domain-level exceptions and public exports

## Deliverables

### 1) Domain package structure

The domain package structure is:

```text
packages/domain/
├── __init__.py
├── exceptions.py
└── models/
    ├── __init__.py
    ├── incident.py
    ├── analysis.py
    ├── audit.py
    ├── agent_state.py
    └── events.py
```

### 2) Incident model contract

File: packages/domain/models/incident.py

Enums:
- IncidentPriority with values: critical, high, medium, low
- IncidentStatus with values:
  - new
  - triaging
  - analyzed
  - bug_created
  - pr_created
  - resolved
  - analysis_failed

Model: Incident
- id: UUID (default uuid4)
- correlation_id: UUID (default uuid4)
- source: str
- exception_type: str
- exception_message: str
- stack_trace: str | None
- fingerprint: str
- priority: IncidentPriority (default medium)
- status: IncidentStatus (default new)
- exception_language: str | None
- raw_payload: dict[str, Any] (default empty dict)
- created_at: datetime UTC now
- updated_at: datetime UTC now

Fingerprint derivation contract:
- If fingerprint is missing or empty, compute SHA-256 hex digest from:
  - exception_type + ":" + first 200 chars of exception_message
- Implement with a Pydantic model validator in before mode.

### 3) Analysis model contracts

File: packages/domain/models/analysis.py

Model: CodeSnippet
- file_path: str
- start_line: int
- end_line: int
- content: str
- repo: str
- commit_sha: str

Model: RAGResult
- source: str
- title: str
- excerpt: str
- relevance_score: float
- url: str | None (default None)

Model: RootCauseJson
- component: str
- likely_cause: str
- contributing_factors: list[str]
- confidence: float

Model: Recommendation
- rank: int
- title: str
- description: str
- affected_files: list[str]
- suggested_change: str
- confidence: float
- source_refs: list[str] (default empty list)

Model: IncidentAnalysis
- id: UUID (default uuid4)
- incident_id: UUID
- root_cause: str | None (default None)
- root_cause_json: RootCauseJson | None (default None)
- recommendations: list[Recommendation] (default empty list)
- code_snippets: list[CodeSnippet] (default empty list)
- rag_results: list[RAGResult] (default empty list)
- agent_trace: list[AgentTraceEntry] (default empty list)
- created_at: datetime UTC now

Cross-model contract:
- IncidentAnalysis references AgentTraceEntry from audit model.
- analysis model rebuilds Pydantic model after AgentTraceEntry import.

### 4) Audit model contracts

File: packages/domain/models/audit.py

Model: AgentTraceEntry
- agent_name: str
- prompt_version: str | None (default None)
- input_summary: str
- output_summary: str
- llm_model: str | None (default None)
- tokens_used: int | None (default None)
- latency_ms: int
- timestamp: datetime UTC now
- error: str | None (default None)

Model: AuditLog
- id: UUID (default uuid4)
- incident_id: UUID | None (default None)
- agent_name: str
- action: str
- input_summary: str | None (default None)
- output_summary: str | None (default None)
- actor_identity: str | None (default None)
- metadata: dict[str, Any] (default empty dict)
- created_at: datetime UTC now

### 5) Pipeline state contract

File: packages/domain/models/agent_state.py

Define IncidentState as TypedDict(total=False).

IncidentState keys include:
- incident_id
- correlation_id
- exception_type
- exception_message
- stack_trace
- raw_payload
- exception_language
- ado_repository
- priority
- triage_labels
- group_id
- approval_status
- approved_recommendation_rank
- root_cause_summary
- root_cause_json
- recent_commits
- dependency_context
- code_snippets
- rag_results
- recommendations
- code_fix_result
- pr_branch
- pr_url
- validation_report
- monitoring_result
- agent_trace
- errors

State serialization contract:
- Nested values intended for graph persistence use dict/list primitives to remain JSON-serializable.

### 6) Incident event contract

File: packages/domain/models/events.py

Model: IncidentEvent
- incident_id: UUID
- correlation_id: UUID
- source: str
- exception_type: str
- exception_message: str
- fingerprint: str
- priority: str
- status: str
- published_at: datetime UTC now
- event_id: UUID (default uuid4)

### 7) Domain exceptions contract

File: packages/domain/exceptions.py

Exception hierarchy:
- DomainError
- IncidentNotFoundError(DomainError)
- DuplicateIncidentError(DomainError)

### 8) Export surface contract

File: packages/domain/models/__init__.py exports:
- AgentTraceEntry
- AuditLog
- CodeSnippet
- Incident
- IncidentAnalysis
- IncidentEvent
- IncidentPriority
- IncidentState
- IncidentStatus
- RAGResult
- Recommendation
- RootCauseJson

File: packages/domain/__init__.py exports:
- DomainError
- IncidentNotFoundError
- DuplicateIncidentError
- AgentTraceEntry
- AuditLog
- CodeSnippet
- Incident
- IncidentAnalysis
- IncidentPriority
- IncidentState
- IncidentStatus
- RAGResult
- Recommendation
- RootCauseJson

## Security Touchpoints

- Domain models do not embed secrets or credential material.
- Audit and trace structures preserve action provenance fields for governance workflows.
- Pipeline state schema supports auditability via agent_trace and errors fields.
- Domain contracts are pure data contracts and do not perform network or filesystem side effects.

## Acceptance Criteria

- python -c "from packages.domain import Incident, IncidentAnalysis, IncidentPriority, IncidentState, AuditLog; print('OK')" prints OK.
- python -c "from packages.domain.models.events import IncidentEvent; print('OK')" prints OK.
- pytest tests/unit/test_domain_incident.py tests/unit/test_domain_analysis.py tests/unit/test_domain_agent_state.py -v executes successfully.
- ruff check packages/domain/ exits 0.
- mypy packages/domain/ --strict exits 0.

## Out of Scope

- ORM schema design and persistence mapping details.
- API response schema definitions outside packages/domain.
- Agent orchestration logic and routing rules.
- Database migration scripts and storage indexing strategy.

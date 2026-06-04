# Phase 8 - Code Context Agent

## Goal

Define and enforce the canonical Code Context Agent contract in the LangGraph analysis pipeline.

This phase establishes:
- source-control-backed snippet retrieval for user-code stack frames
- deterministic frame filtering and prioritization
- bounded source snippet extraction with commit metadata
- traceable, failure-tolerant code-context enrichment written to IncidentState

## Deliverables

### 1) Code context package structure contract

The code context package structure is:

```text
packages/agent_runtime/code_context/
├── __init__.py
├── agent.py
├── frame_filter.py
└── models.py
```

Azure DevOps integration structure:

```text
packages/integrations/azure_devops/
├── __init__.py
└── client.py
```

### 2) Code snippet model contract

File: packages/agent_runtime/code_context/models.py

Model: CodeSnippet
- file_path: str
- start_line: int
- end_line: int
- content: str
- repo: str
- commit_sha: str

### 3) Frame filter contract

File: packages/agent_runtime/code_context/frame_filter.py

Function:
- filter_frames(frames: list[StackFrame], path_prefix: str = "") -> list[StackFrame]

Filtering contract:
- Keep only frames that are:
  - marked user code
  - have file_path
  - have line_number
- Exclude framework/library internal frames using language-aware internals registry.
- When path_prefix is provided, prioritize frames whose file_path starts with that prefix.
- Return at most 5 application frames.
- If all application frames are denied by internal filtering, fall back to up to 3 qualifying frames.

### 4) Code context node runtime contract

File: packages/agent_runtime/code_context/agent.py

Factory contract:
- make_code_context_node(ado_client=None, settings=None)

Input fields read from IncidentState:
- incident_id
- stack_trace
- agent_trace
- errors

Output fields written to IncidentState:
- code_snippets
- agent_trace (append)
- errors (append on failure)

Execution contract:
- Parse stack frames using root cause stack parser.
- Resolve SCM client from injected dependency or settings.
- Fetch latest commit SHA once per execution.
- Filter candidate frames via frame_filter.
- Retrieve file content for each selected frame.
- Build bounded snippets around each line number.
- Return at most 5 snippets.

Skip behavior contract:
- If SCM is not configured, return empty code_snippets without error.
- If a file cannot be fetched, skip that frame.
- If stack trace is empty or no qualifying frames exist, return empty code_snippets.

Snippet extraction contract:
- Use 20 lines of context on each side of the target line.
- Clamp start and end lines to file bounds.
- Preserve repository name and latest commit SHA in snippet metadata.

### 5) Azure DevOps client contract

File: packages/integrations/azure_devops/client.py

Class: AzureDevOpsClient
- get_file_content(file_path) -> str | None
- get_recent_commits(file_path, top=5) -> list[dict[str, str]]
- get_latest_commit_sha() -> str
- from_settings(settings)
- async context manager support

Authentication contract:
- Uses BasicAuth with empty username and PAT as password.

Repository access contract:
- Reads content from configured org, project, repository, and branch.
- Returns None or empty results on fetch errors rather than raising through public helpers.

Settings contract:
- azure_devops_org_url
- azure_devops_project
- azure_devops_repository
- azure_devops_branch
- azure_devops_pat
- ado_source_path_prefix

### 6) Pipeline integration contract

File: packages/agent_runtime/pipeline.py

Graph placement contract:
- code_context executes after root_cause and before rag.

Canonical sequence segment:
- triage -> root_cause -> code_context -> rag

## Security Touchpoints

- Code context retrieval is read-only against source control.
- Authentication uses configured PAT through settings.
- Missing SCM configuration degrades safely without failing the pipeline.
- Returned code snippets are bounded in size and tied to explicit repository/commit metadata.
- Trace entries preserve observability for each code-context execution.

## Acceptance Criteria

- python -c "from packages.agent_runtime.code_context.agent import make_code_context_node; print('OK')" prints OK.
- python -c "from packages.agent_runtime.code_context.frame_filter import filter_frames; print('OK')" prints OK.
- python -c "from packages.integrations.azure_devops.client import AzureDevOpsClient; print('OK')" prints OK.
- pytest tests/unit/test_code_context_agent.py -v executes successfully.
- ruff check packages/agent_runtime/code_context/ packages/integrations/azure_devops/ exits 0.
- mypy packages/agent_runtime/code_context/ packages/integrations/azure_devops/ --strict exits 0.

## Out of Scope

- Source-control write actions.
- Patch generation or code modification.
- Multi-provider SCM abstraction beyond the current Azure DevOps path.
- LLM-based snippet summarization or ranking.

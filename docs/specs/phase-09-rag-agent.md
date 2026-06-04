# Phase 9 - RAG Retrieval Agent

## Goal

Define and enforce the canonical RAG Retrieval Agent contract in the LangGraph analysis pipeline.

This phase establishes:
- hybrid Azure AI Search retrieval for incident analysis context
- deterministic query construction from root-cause state
- score-threshold filtering and weighted reranking
- normalized RAG result output written to IncidentState

## Deliverables

### 1) RAG package structure contract

The RAG package structure is:

```text
packages/agent_runtime/rag/
├── __init__.py
├── agent.py
├── models.py
├── query_builder.py
└── reranker.py
```

Search integration structure:

```text
packages/integrations/azure_search/
├── __init__.py
└── client.py
```

### 2) RAG result model contract

File: packages/agent_runtime/rag/models.py

Model: RAGResult
- source: str
- title: str
- excerpt: str
- relevance_score: float (clamped to >= 0.0)
- url: str | None
- exception_type: str | None

### 3) Query builder contract

File: packages/agent_runtime/rag/query_builder.py

Dataclass: SearchQuery
- text: str
- vector_text: str
- filter_expr: str | None
- top: int (default 10)

Function:
- build_search_query(state: IncidentState) -> SearchQuery

Query construction contract:
- text query uses: exception_type + component + likely_cause.
- vector_text uses root_cause_summary when available; otherwise falls back to text query.
- text and vector_text are truncated to bounded length.
- when exception_type exists, filter_expr prefers:
  - source_type eq prior_fix for the matching exception_type
  - source_type eq runbook

### 4) Reranking contract

File: packages/agent_runtime/rag/reranker.py

Function:
- rerank(results: list[RAGResult], state: IncidentState) -> list[RAGResult]

Reranking contract:
- Input candidates are rescored with weighted composite score:
  - Azure Search relevance score weight: 0.5
  - source type priority weight: 0.3
  - exception type affinity weight: 0.2
- Source type priority ordering:
  - prior_fix > runbook > documentation > source_code > default
- Returns top 5 results.
- Returned relevance_score is replaced with rounded composite score.

### 5) RAG agent runtime contract

File: packages/agent_runtime/rag/agent.py

Factory contract:
- make_rag_node(search_client=None, settings=None)

Input fields read from IncidentState:
- incident_id
- exception_type
- root_cause_summary
- root_cause_json
- triage_labels

Output fields written to IncidentState:
- rag_results
- agent_trace (append)
- errors (append on failure)

Execution contract:
- RAG node does not call an LLM.
- Resolves search client from injected dependency or settings-based AzureSearchClient.
- Builds SearchQuery via query_builder.
- Executes search and maps raw results into RAGResult candidates.
- Applies score-threshold filtering before reranking.
- Applies rerank() and writes final normalized top results to state.

Threshold contract:
- Candidate filtering threshold uses relevance_score > 0.3 before reranking.

Failure contract:
- On retrieval failure, node appends error to state.errors and trace entry.
- Pipeline continues with empty rag_results.

### 6) Azure AI Search client contract

File: packages/integrations/azure_search/client.py

Class: AzureSearchClient
- search(query, top=10, vector_text=None, filter_expr=None) -> list[dict[str, Any]]
- from_settings(settings) constructor
- async context manager support

Authentication contract:
- Prefer AzureKeyCredential when API key is provided.
- Fall back to DefaultAzureCredential when API key is not provided.

Hybrid retrieval contract:
- Submit keyword query.
- Include vector query when vector query support is available.
- Fall back gracefully to non-vector query mode when vector query types are unavailable.

### 7) Pipeline integration contract

File: packages/agent_runtime/pipeline.py

Graph placement contract:
- rag node executes after code_context and before fix_planner.

Canonical sequence segment:
- root_cause -> code_context -> rag -> fix_planner

## Security Touchpoints

- RAG retrieval is read-only against search index data.
- Authentication uses managed identity or configured key through settings.
- Retrieval failures are captured in agent trace and errors without unsafe pipeline termination.
- Returned excerpts are bounded in length before state persistence.

## Acceptance Criteria

- python -c "from packages.agent_runtime.rag.agent import make_rag_node; print('OK')" prints OK.
- python -c "from packages.agent_runtime.rag.query_builder import build_search_query; print('OK')" prints OK.
- python -c "from packages.agent_runtime.rag.reranker import rerank; print('OK')" prints OK.
- pytest tests/unit/test_rag_agent.py -v executes successfully.
- ruff check packages/agent_runtime/rag/ packages/integrations/azure_search/ exits 0.
- mypy packages/agent_runtime/rag/ packages/integrations/azure_search/ --strict exits 0.

## Out of Scope

- Prompt-based retrieval reformulation with direct LLM calls.
- Search indexing and ingestion pipeline management.
- Cross-provider retrieval adapters beyond current Azure Search integration.
- Final recommendation synthesis (handled by downstream fix planner).

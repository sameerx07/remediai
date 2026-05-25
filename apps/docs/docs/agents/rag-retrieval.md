---
sidebar_position: 5
title: RAG Retrieval Agent
---

# RAG Retrieval Agent

The RAG Retrieval Agent queries the Azure AI Search index to find documentation, runbooks, and prior remediation records relevant to the current incident.

---

## Responsibility

- Build a search query from the root cause summary and exception type.
- Execute a hybrid (vector + keyword) search against the Azure AI Search index.
- Return the top K results filtered by relevance score.
- Prioritise content by source type: runbooks > prior fixes > documentation > source code.

:::info No LLM call
The RAG Retrieval Agent does **not** call Azure OpenAI directly. Azure AI Search handles the vector embedding internally using the configured vectoriser.
:::

---

## Input fields

| Field | Source |
|-------|--------|
| `root_cause_summary` | Root Cause Agent output |
| `root_cause_json` | Root Cause Agent output (`component`, `likely_cause`) |
| `triage_labels` | Triage Agent output |

---

## Output fields

| Field | Type | Description |
|-------|------|-------------|
| `rag_results` | `list[RAGResult]` | Top K relevant documents |

---

## `RAGResult` schema

```python
class RAGResult(BaseModel):
    source: str           # "runbook" | "prior_fix" | "documentation" | "source_code"
    title: str
    excerpt: str          # Relevant text excerpt (max 500 chars)
    relevance_score: float # 0.0–1.0
    url: str | None       # Direct link if available
```

---

## Logic

```
1. Build the search query:
   query = f"{root_cause_json.likely_cause} {exception_type} {' '.join(triage_labels)}"

2. Call Azure AI Search with:
   - queryType: semantic (hybrid mode)
   - search: query string
   - select: source, title, content, url
   - top: RAG_TOP_K (default: 10)
   - semanticConfiguration: remediai-semantic

3. Filter results: keep only those with relevance_score > RAG_MIN_SCORE (default: 0.6).

4. Sort by source priority:
   runbook (1) > prior_fix (2) > documentation (3) > source_code (4)
   Then by relevance_score descending within each tier.

5. Take top RAG_MAX_RESULTS (default: 5).

6. Write AgentTraceEntry to state["agent_trace"].
```

---

## Azure AI Search index

The index (`remediai-rag`) is populated with content from:

| Source type | Content | Indexed fields |
|------------|---------|---------------|
| `runbook` | Operational runbooks from `docs/runbooks/` | title, content, tags |
| `prior_fix` | Historical incident analyses with resolved status | exception_type, root_cause, fix_applied |
| `documentation` | Internal architecture docs, ADRs | title, content |
| `source_code` | Application source files (chunked) | file_path, content, namespace |

Index population is handled by the Phase 17 indexer (`scripts/populate_search_index.py`).

---

## Example output

```json
[
  {
    "source": "runbook",
    "title": "Handling NullReferenceException in Repository Pattern",
    "excerpt": "When a repository method returns null instead of throwing, ensure callers apply a null-coalescing pattern or throw NotFoundException explicitly...",
    "relevance_score": 0.94,
    "url": "https://dev.azure.com/akeesari/remediai/_wiki/runbooks/null-reference"
  },
  {
    "source": "prior_fix",
    "title": "Fix for incident abc-123: UserService.GetById null dereference",
    "excerpt": "Added null check on line 42. Merged in PR #441. Root cause was missing guard clause at the service layer...",
    "relevance_score": 0.88,
    "url": "https://dev.azure.com/.../pullrequest/441"
  }
]
```

---

## Configuration

| Env var | Description |
|---------|-------------|
| `AZURE_SEARCH_ENDPOINT` | Azure AI Search endpoint URL |
| `AZURE_SEARCH_INDEX` | Index name (default: `remediai-rag`) |
| `RAG_TOP_K` | Number of results to request from Search (default: `10`) |
| `RAG_MIN_SCORE` | Minimum relevance score to include (default: `0.6`) |
| `RAG_MAX_RESULTS` | Maximum results returned to Fix Planner (default: `5`) |

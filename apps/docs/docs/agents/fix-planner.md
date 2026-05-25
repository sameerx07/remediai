---
sidebar_position: 6
title: Fix Planner Agent
---

# Fix Planner Agent

The Fix Planner Agent synthesizes root cause analysis, source code context, and RAG retrieval results to produce a ranked list of remediation recommendations.

---

## Responsibility

- Generate up to 3 remediation recommendations, ranked by confidence.
- Each recommendation identifies target files, describes the suggested change, and cites evidence from code snippets and RAG results.
- Recommendations are stored and presented to engineers for approval via the dashboard.

---

## Input fields

| Field | Source |
|-------|--------|
| `root_cause_summary` | Root Cause Agent |
| `root_cause_json` | Root Cause Agent |
| `code_snippets` | Code Context Agent |
| `rag_results` | RAG Retrieval Agent |

---

## Output fields

| Field | Type | Description |
|-------|------|-------------|
| `recommendations` | `list[Recommendation]` | Ranked list of 1–3 fix options |

---

## `Recommendation` schema

```python
class Recommendation(BaseModel):
    rank: int                    # 1 = highest confidence
    title: str                   # Short title for display
    description: str             # 2–3 sentence explanation
    affected_files: list[str]    # File paths this fix touches
    suggested_change: str        # Concrete code change or instruction
    confidence: float            # 0.0–1.0
    source_refs: list[str]       # IDs of RAG results or snippets cited
```

---

## Logic

```
1. Build the fix planner prompt, including:
   - root_cause_summary and root_cause_json
   - Up to 5 code_snippets (file path + content)
   - Up to 5 rag_results (title + excerpt)

2. Call LLM with fix planner prompt.

3. Parse structured recommendations list from response.
   Validate each item against the Recommendation schema.

4. Sort by confidence score descending.

5. Limit to top 3 recommendations.

6. Write AgentTraceEntry to state["agent_trace"].
```

---

## LLM prompt

Prompt file: `docs/prompts/fix_planner_v1.md`

The prompt instructs the model to:
- Propose concrete, specific changes — not vague advice.
- Ground every recommendation in the provided code snippets or RAG context.
- Assign `confidence >= 0.85` only when a prior fix with the same root cause is found in RAG results.
- Assign `confidence < 0.5` for speculative fixes with no supporting evidence.
- Return a JSON array of recommendation objects.

---

## Example output

```json
[
  {
    "rank": 1,
    "title": "Add null guard before dereferencing user object",
    "description": "The repository returns null when a user is not found but the service layer does not check for null before accessing properties. Adding a null guard and returning a 404 response is the standard pattern used in this codebase.",
    "affected_files": ["/src/Services/UserService.cs"],
    "suggested_change": "var user = await _repository.GetByIdAsync(id);\nif (user is null) throw new NotFoundException($\"User {id} not found\");",
    "confidence": 0.93,
    "source_refs": ["rag:runbook-null-reference", "snippet:UserService.cs:22-62"]
  },
  {
    "rank": 2,
    "title": "Enforce non-null return contract at repository layer",
    "description": "Update the repository interface to throw NotFoundException rather than returning null, eliminating the null check requirement at the service layer for all callers.",
    "affected_files": [
      "/src/Repositories/IUserRepository.cs",
      "/src/Repositories/UserRepository.cs"
    ],
    "suggested_change": "Change return type to Task<User> (non-nullable) and throw NotFoundException inside GetByIdAsync when not found.",
    "confidence": 0.74,
    "source_refs": ["rag:documentation-repository-pattern"]
  }
]
```

---

## What happens after

Recommendations are stored in `incident_analyses.recommendations` and displayed in the React dashboard. A developer reviews them and clicks **Approve** on one. The approval event triggers the [PR Agent](./pr-agent).

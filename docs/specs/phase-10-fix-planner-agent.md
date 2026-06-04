# Phase 10 - Fix Planner Agent

## Goal

Define and enforce the canonical Fix Planner Agent contract in the LangGraph analysis pipeline.

This phase establishes:
- LLM-based remediation recommendation generation
- recommendation model validation and confidence normalization
- deterministic post-processing (sort, cap, rank renumbering)
- fallback behavior when planning fails

## Deliverables

### 1) Fix planner package structure contract

The fix planner package structure is:

```text
packages/agent_runtime/fix_planner/
├── __init__.py
├── agent.py
└── models.py
```

Associated artifacts:

```text
docs/prompts/fix_planner_v1.md
tests/unit/test_fix_planner_agent.py
```

### 2) Fix planner model contract

File: packages/agent_runtime/fix_planner/models.py

Model: Recommendation
- rank: int
- title: str
- description: str
- affected_files: list[str] (default empty)
- suggested_change: str (default empty)
- confidence: float (default 0.5, clamped to [0, 1])
- source_refs: list[str] (default empty)

Model: FixPlannerOutput
- recommendations: list[Recommendation]

### 3) Prompt loading contract

File: packages/agent_runtime/fix_planner/agent.py

Prompt contract:
- Fix planner prompt is loaded through prompt registry.
- Prompt key: fix_planner
- Prompt version: 1
- Agent trace prompt_version value: fix_planner_v1

### 4) Fix planner node runtime contract

File: packages/agent_runtime/fix_planner/agent.py

Factory contract:
- make_fix_planner_node(llm)

Input fields read from IncidentState:
- incident_id
- root_cause_summary
- root_cause_json
- code_snippets (top 3 used)
- rag_results (top 5 used)

Output fields written to IncidentState:
- recommendations
- agent_trace (append)
- errors (append on failure)

Execution contract:
- Build LLM payload from root-cause context, code snippets, and RAG results.
- Apply PII scrubbing to root_cause_summary before prompt payload construction.
- Parse LLM JSON response into FixPlannerOutput.
- Post-process recommendations by:
  - sorting by confidence descending
  - limiting to top 3
  - renumbering rank values to 1..N in output order

### 5) Fallback and failure contract

File: packages/agent_runtime/fix_planner/agent.py

On LLM or parsing failure:
- Return deterministic fallback recommendation:
  - title: Gather more diagnostic evidence
  - confidence: 0.3
- Append error to state.errors.
- Include error details in agent trace entry.
- Continue pipeline execution.

### 6) Pipeline integration contract

File: packages/agent_runtime/pipeline.py

Graph placement contract:
- fix_planner executes after rag.
- routing from fix_planner is conditional:
  - approval_status == approved -> code_fix_agent
  - otherwise -> END

Canonical sequence segment:
- code_context -> rag -> fix_planner -> (code_fix_agent or END)

## Security Touchpoints

- Fix planner payload uses scrubbed summary text for LLM input.
- Agent emits trace entries for auditing recommendation generation outcomes.
- Failure path is deterministic and avoids unhandled pipeline termination.
- Fix planner output is recommendation-only and does not execute code changes.

## Acceptance Criteria

- python -c "from packages.agent_runtime.fix_planner.agent import make_fix_planner_node; print('OK')" prints OK.
- python -c "from packages.agent_runtime.fix_planner.models import Recommendation, FixPlannerOutput; print('OK')" prints OK.
- pytest tests/unit/test_fix_planner_agent.py -v executes successfully.
- ruff check packages/agent_runtime/fix_planner/ exits 0.
- mypy packages/agent_runtime/fix_planner/ --strict exits 0.

## Out of Scope

- Automatic patch creation from recommendations.
- Pull request creation behavior (handled by downstream code-fix and PR agents).
- External ticket creation workflows.
- Autonomous merge or deployment actions.

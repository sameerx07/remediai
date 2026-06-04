# Phase 13 - Prompt Versioning + Agent Eval Harness

## Goal

Define the canonical prompt registry and agent evaluation harness used to
validate the incident-analysis pipeline without real Azure credentials.

This phase establishes:
- a versioned prompt registry backed by docs/prompts markdown files
- prompt loading, cache reuse, and version enumeration for triage, root cause,
  and fix-planner prompts
- an end-to-end eval harness that exercises the current five-node analysis
  pipeline against representative incident fixtures
- stable fixture expectations for rule-matched and unknown-exception paths

## Deliverables

### 1) Prompt registry contract

File: packages/agent_runtime/prompt_registry.py

Class: PromptRegistry
- `load(name, version)` reads `docs/prompts/{name}_v{version}.md`
- `available_versions(name)` returns sorted version strings present on disk
- `clear_cache()` resets the in-process cache

Singleton contract:
- `get_registry()` returns a module-level singleton `PromptRegistry`
- repeated calls return the same registry instance

Prompt file contract:
- `docs/prompts/triage_v1.md`
- `docs/prompts/triage_v2.md`
- `docs/prompts/root_cause_v1.md`
- `docs/prompts/root_cause_v2.md`
- `docs/prompts/fix_planner_v1.md`

Current delegation contract:
- triage prompt loading delegates through the registry
- root cause prompt loading delegates through the registry
- fix planner prompt loading delegates through the registry

### 2) Agent eval harness contract

File: tests/agent-evals/test_agent_evals.py

Harness contract:
- Runs the current analysis pipeline against representative incident fixtures
- Uses mocked LLM, Azure DevOps Repos, and Azure AI Search clients
- Does not require Azure Boards or other ticketing credentials
- Keeps the rule-matched path deterministic for NullReference and OOM fixtures
- Keeps the unknown-exception path LLM-driven for triage, root cause, and fix planning

Current test shape:
- 23 tests across 4 test classes

### 3) Fixture contract

Files:
- tests/agent-evals/fixtures/null_reference.json
- tests/agent-evals/fixtures/out_of_memory.json
- tests/agent-evals/fixtures/unknown_exception.json

Each fixture includes:
- incident identity fields
- exception_type
- exception_message
- stack_trace
- raw_payload
- agent_trace
- errors
- triage_labels
- expected assertions

Expected assertion contract:
- `priority`
- `triage_labels_contains`
- `triage_rule_matched`
- `trace_agent_names`
- `llm_call_count` for the unknown path
- `errors_empty`
- `has_root_cause_summary`
- `has_recommendations`
- `rag_results_min_count`
- `recommendation_confidence_min`
- `root_cause_component_not_empty`

### 4) Pipeline trace contract

Current analysis trace order:
- triage
- root_cause
- code_context
- rag
- fix_planner

The eval harness must not expect a bug-creation or Boards node in the trace.

LLM call contract:
- Rule-matched incidents use 2 LLM calls: root_cause + fix_planner
- Unknown exceptions use 3 LLM calls: triage + root_cause + fix_planner

### 5) Mocked dependency contract

The harness uses mocked dependencies for:
- LLM responses
- Azure DevOps Repos file reads
- Azure AI Search retrieval

No Azure Boards mock is part of the current harness contract.

## Security Touchpoints

- The harness runs without real Azure credentials.
- Prompt files are read locally from the repository; no remote prompt source is
  required.
- Fixture data is static and deterministic so the eval suite can run in CI.
- The harness does not exercise ticketing writes or other side effects.

## Acceptance Criteria

- `ruff check .` passes.
- `mypy apps/ packages/ --strict` passes.
- `pytest tests/agent-evals/test_agent_evals.py -q` passes.
- `PromptRegistry.available_versions("triage")` returns both v1 and v2.
- `PromptRegistry.clear_cache()` empties the in-process cache.
- Rule-matched fixtures assert a five-agent trace without `bug_creator`.
- Unknown-exception fixtures assert 3 LLM calls and the same five-agent trace.
- No fixture or test expects `ado_bug_id`, `ado_bug_url`, or Azure Boards work-item creation.

## Out of Scope

- Prompt optimization or automatic prompt rewriting.
- Azure Boards or other ticketing integrations.
- Production telemetry or evaluation result publishing.
- Additional fixture families beyond the current null-reference, out-of-memory,
  and unknown-exception samples.

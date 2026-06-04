# Phase 11 - Incident External Reference Contract

## Goal

Define the current external Azure DevOps reference contract used by incident analysis, incident APIs, and downstream PR automation.

This phase reflects the post-Boards implementation state:
- there is no Azure DevOps Boards bug-creation node in the active analysis pipeline
- incident records persist pull request references directly on the incident row
- incident APIs expose PR and approval metadata to downstream consumers
- the worker persists PR metadata only on the approval-gated PR path
- monitoring keeps a compatibility fallback for legacy work-item-based PR references

## Deliverables

### 1) Active pipeline boundary contract

File: packages/agent_runtime/pipeline.py

The active analysis pipeline does not include a bug creator node.

Canonical sequence:
- triage -> root_cause -> code_context -> rag -> fix_planner
- fix_planner -> END when approval_status is not approved
- fix_planner -> code_fix_agent -> pr_agent -> validation_agent -> END when approval_status is approved

Factory contract:
- build_pipeline(llm=None, settings=None, ado_client=None, search_client=None, ado_writer=None, pr_reader=None)

This contract replaces the earlier Boards-based pipeline shape. No `boards_client`
parameter is part of the current pipeline factory.

### 2) Incident state external reference contract

File: packages/domain/models/agent_state.py

IncidentState fields used for approval-gated repository automation:
- approval_status: str | None
- approved_recommendation_rank: int | None
- pr_branch: str | None
- pr_url: str | None

These fields are the live handoff boundary between the analysis path and the
later PR creation / validation path.

### 3) Incident persistence contract

File: packages/data_access/models/incident_orm.py

The incidents table stores external PR metadata directly on the incident row.

Columns:
- approval_status: str | None
- approved_by: str | None
- approved_at: datetime | None
- approved_recommendation_rank: int | None
- pr_url: str | None
- pr_branch: str | None

Persistence contract:
- PR metadata is stored directly on `IncidentOrm`.
- The codebase no longer defines a dedicated work-item ORM as part of the
  active implementation.
- The source comment on `IncidentOrm` documents that PR fields were moved from
  the earlier work-item model after Azure DevOps Boards removal.

### 4) Worker persistence contract

File: apps/worker/agents/runner.py

Execution contract:
- The normal analysis path persists analysis data and trace entries only.
- The normal analysis path does not create Azure DevOps bug records.
- When an incident is already analyzed and has `approval_status == "approved"`,
  the runner executes the PR and validation path.
- When the PR path returns a `pr_url`, the runner persists `pr_url` and
  `pr_branch` directly onto `IncidentOrm`.

### 5) Incident API contract

Files:
- apps/api/schemas/incident.py
- apps/api/routers/incidents.py

List response contract:
- `IncidentListItem` includes `pr_url`.
- The list endpoint exposes PR availability without loading legacy work-item
  objects.

Detail response contract:
- `IncidentDetail` includes:
  - approval_status
  - approved_by
  - approved_at
  - approved_recommendation_rank
  - pr_url
  - pr_branch
- The detail endpoint returns analysis outputs and PR metadata from the current
  incident + analysis model only.

### 6) Monitoring compatibility contract

File: apps/api/routers/monitoring.py

Compatibility behavior:
- Monitoring requires a PR reference before post-deploy monitoring can start.
- The router first checks `IncidentOrm.pr_url`.
- If `pr_url` is absent, the router falls back to `_get_pr_url()` and attempts
  to read a legacy PR reference from `work_items` when that relationship is
  present on the loaded object.

This fallback exists for compatibility only and does not reintroduce a Boards
integration requirement into the active pipeline.

## Security Touchpoints

- The active analysis path does not perform Azure DevOps Boards writes.
- PR metadata is written only after an explicit approval-gated path executes.
- Monitoring endpoints require API authentication before allowing monitor
  trigger or result access.
- External reference persistence is limited to explicit PR metadata fields on
  the incident record.

## Acceptance Criteria

- `python -c "from packages.agent_runtime.pipeline import build_pipeline; print('OK')"` prints `OK`.
- `python -c "from packages.domain.models.agent_state import IncidentState; print('OK')"` prints `OK`.
- `python -c "from packages.data_access.models.incident_orm import IncidentOrm; print('OK')"` prints `OK`.
- `python -c "from apps.api.schemas.incident import IncidentListItem, IncidentDetail; print('OK')"` prints `OK`.
- `pytest tests/unit/test_incidents_router.py -v` executes successfully.
- `ruff check apps/api/routers/incidents.py apps/api/routers/monitoring.py packages/domain/models/agent_state.py packages/data_access/models/incident_orm.py apps/worker/agents/runner.py` exits 0.

## Out of Scope

- Automatic Azure DevOps Boards bug creation.
- Dedicated Boards client contracts or work-item creation APIs.
- Dashboard rendering details for legacy work-item links.
- Pull request patch generation and PR creation logic itself, which belongs to
  the later approval-gated automation phases.

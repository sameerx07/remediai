# Phase 1 — Project Structure & Application Scaffold

## Objective

Create the complete repository skeleton for RemediAI: all directory structure,
Python project configuration (`pyproject.toml`), Docker Compose dev environment,
FastAPI application shell with a working `/health` endpoint, structured logging,
`pydantic-settings` configuration, and pytest infrastructure.

After this phase:
- `pytest tests/unit/` passes
- `ruff check .` passes with zero violations
- `mypy apps/api/ --strict` passes with zero errors
- `uvicorn apps.api.main:app` starts and `GET /health` returns `{"status": "ok"}`
- All directories from `README.md` exist on disk

## Milestone

`ROADMAP.md` — Milestone 1: Foundation
Check off: `Repository structure scaffolded` and `Basic FastAPI app with health check endpoint`

---

## Structure Reference — Enterprise GenAI Pattern

This phase aligns RemediAI's folder structure with the
[Enterprise GenAI Project Folder Structure](../enterprise-agent-platform-structure.md).
The table below maps each enterprise pattern to RemediAI's equivalent and records
what is already done, what is being added in this phase, and what is intentionally
out of scope.

| Enterprise Pattern | RemediAI Equivalent | Status |
|---|---|---|
| `agents/orchestrators/` | `packages/agent_runtime/pipeline.py` | ✅ Exists |
| `agents/specialists/` | `packages/agent_runtime/{triage,root_cause,code_fix,pr_agent,…}` | ✅ Exists |
| `orchestrators/graph.py` | `packages/agent_runtime/pipeline.py` | ✅ Exists |
| `orchestrators/state.py` | `packages/domain/models/agent_state.py` | ✅ Exists |
| `orchestrators/router.py` | Routing inline in `pipeline.py` | ✅ Exists |
| `tools/registry.py` | `packages/integrations/providers/registry.py` | ✅ Exists |
| `tools/definitions/` | `packages/integrations/` (ADO, Azure Monitor, Azure Search) | ✅ Exists |
| `tools/mcp_servers/` | — | ⛔ Out of scope (future) |
| `routes/registry.yaml` | FastAPI routers serve as the contract — no YAML needed | ⛔ Not applicable |
| `api/routes/` | `apps/api/routers/` | ✅ Exists |
| `api/schemas/` | `apps/api/schemas/` | ✅ Exists |
| `api/auth/` | `apps/api/core/auth.py` (inline) | 🔧 Needs split → `apps/api/auth/` |
| `api/middlewares/` | Middleware inline in `apps/api/main.py` | 🔧 Needs split → `apps/api/middlewares/` |
| `governance/guardrails/` | `packages/integrations/pii_scrubber.py` (scattered) | 🔧 Needs `packages/governance/guardrails/` |
| `governance/policies/` | `SECURITY_GUARDRAILS.md` (doc only) | 🔧 Needs `packages/governance/policies/` |
| `governance/audit/` | `packages/data_access/models/audit_log_orm.py` | ✅ Exists |
| `evals/datasets/` | Flat files under `tests/agent-evals/` | 🔧 Needs `evals/datasets/` |
| `evals/suites/` | Flat files under `tests/agent-evals/` | 🔧 Needs `evals/suites/` |
| `evals/reports/` | Not structured | 🔧 Needs `evals/reports/` |
| `tests/unit/` | `tests/unit/` | ✅ Exists |
| `tests/integration/` | `tests/integration/` | ✅ Exists |
| `docs/architecture/` | `docs/architecture/` | ✅ Exists |
| `README.md`, `CLAUDE.md`, `.env.example` | All exist at root | ✅ Exists |

> **What is NOT being changed:**
> Renaming `packages/agent_runtime/` to match the `agents/specialists/` naming
> convention would break 30+ imports with zero user-visible benefit — the current
> structure already implements the specialist pattern, just with different directory names.
> `tools/mcp_servers/` and `routes/registry.yaml` are not applicable to RemediAI's
> current architecture.

---

## New Directories to Create (this phase)

### 1. `apps/api/auth/`

Extract authentication logic from `apps/api/core/auth.py` into a proper subdirectory.

```
apps/api/auth/
├── __init__.py
└── dependencies.py      ← require_auth() and other FastAPI auth dependencies
```

**Change:** Move `require_auth()` and related helpers out of `apps/api/core/auth.py`
into `apps/api/auth/dependencies.py`. Update all import paths.

---

### 2. `apps/api/middlewares/`

Extract middleware from `apps/api/main.py` into a dedicated directory.

```
apps/api/middlewares/
├── __init__.py
└── correlation_id.py    ← correlation ID injection middleware
```

**Change:** Move the correlation-ID middleware from `main.py` into
`apps/api/middlewares/correlation_id.py`. Register it in `main.py` via
`app.add_middleware(...)`.

---

### 3. `packages/governance/`

Create a dedicated governance package for safety, guardrails, and policy code.

```
packages/governance/
├── __init__.py
├── guardrails/
│   ├── __init__.py
│   └── pii_scrubber.py  ← moved from packages/integrations/pii_scrubber.py
└── policies/
    ├── __init__.py
    └── agent_policy.py  ← agent action boundaries (what agents can/cannot do)
```

**Change:** Move `packages/integrations/pii_scrubber.py` →
`packages/governance/guardrails/pii_scrubber.py`. Add a re-export shim in the
old location to preserve existing imports during migration:

```python
# packages/integrations/pii_scrubber.py  (shim — delete after all callers updated)
from packages.governance.guardrails.pii_scrubber import scrub  # noqa: F401
```

`agent_policy.py` defines runtime boundaries as simple constants to start:

```python
# packages/governance/policies/agent_policy.py
AGENTS_ALLOWED_TO_PUSH_CODE = {"pr_agent"}
AGENTS_ALLOWED_TO_CREATE_BUGS = {"bug_creator"}
MAX_PATCH_SIZE_LINES = 500
AUTO_MERGE_ENABLED = False
```

---

### 4. `evals/` (top-level evaluation directory)

Move agent evaluation fixtures out of `tests/agent-evals/` into a structured
top-level `evals/` directory that mirrors the enterprise pattern.

```
evals/
├── datasets/            ← labelled input/expected-output fixtures (.json / .yaml)
│   └── .gitkeep
├── suites/              ← grouped evaluation runs (accuracy, safety, regression)
│   └── .gitkeep
└── reports/             ← generated reports — gitignored except baselines
    └── .gitkeep
```

**Change:** Move existing eval fixtures from `tests/agent-evals/` →
`evals/datasets/`. Update `pyproject.toml` `testpaths` if evals are run via pytest.

---

## Full Directory Structure (after this phase)

```
remediai/
├── README.md
├── CLAUDE.md
├── SPEC.md
├── .env.example
├── pyproject.toml
├── docker-compose.yml
├── Makefile
│
├── apps/
│   ├── api/
│   │   ├── main.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── logging.py
│   │   │   └── database.py
│   │   ├── auth/                    ← NEW (extracted from core/auth.py)
│   │   │   ├── __init__.py
│   │   │   └── dependencies.py
│   │   ├── middlewares/             ← NEW (extracted from main.py)
│   │   │   ├── __init__.py
│   │   │   └── correlation_id.py
│   │   ├── routers/
│   │   └── schemas/
│   ├── worker/
│   │   ├── ingestion/
│   │   └── agents/
│   ├── dashboard/
│   └── log_bridge/
│
├── packages/
│   ├── agent_runtime/               ← orchestration + specialist agents
│   │   ├── pipeline.py              ← LangGraph graph (graph + state + router)
│   │   ├── language_detector.py
│   │   ├── language_internals.py
│   │   ├── triage/
│   │   ├── root_cause/
│   │   ├── code_context/
│   │   ├── code_fix/
│   │   ├── rag/
│   │   ├── fix_planner/
│   │   ├── bug_creator/
│   │   ├── pr_agent/
│   │   └── validation_agent/
│   ├── governance/                  ← NEW
│   │   ├── guardrails/
│   │   │   └── pii_scrubber.py     ← moved from packages/integrations/
│   │   └── policies/
│   │       └── agent_policy.py
│   ├── integrations/
│   │   ├── azure_devops/
│   │   ├── azure_monitor/
│   │   ├── azure_search/
│   │   └── providers/
│   ├── domain/
│   │   └── models/
│   ├── data_access/
│   │   └── models/
│   ├── config/
│   └── search/
│
├── evals/                           ← NEW (moved from tests/agent-evals/)
│   ├── datasets/
│   ├── suites/
│   └── reports/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docs/
│   ├── specs/
│   ├── prompts/
│   ├── architecture/
│   └── runbooks/
│
├── infrastructure/
│   ├── helm/
│   ├── terraform/
│   └── k8s/
│
└── alembic/
    └── versions/
```

---

## Files to Create

```
apps/api/auth/__init__.py
apps/api/auth/dependencies.py
apps/api/middlewares/__init__.py
apps/api/middlewares/correlation_id.py
packages/governance/__init__.py
packages/governance/guardrails/__init__.py
packages/governance/guardrails/pii_scrubber.py
packages/governance/policies/__init__.py
packages/governance/policies/agent_policy.py
evals/datasets/.gitkeep
evals/suites/.gitkeep
evals/reports/.gitkeep
```

## Files to Modify

| File | Change |
|------|--------|
| `apps/api/main.py` | Register `CorrelationIdMiddleware` from new `middlewares/` module; remove inline middleware |
| `apps/api/core/auth.py` | Convert to shim re-exporting from `apps/api/auth/dependencies.py` |
| `packages/integrations/pii_scrubber.py` | Convert to shim re-exporting from `packages/governance/guardrails/pii_scrubber.py` |
| `pyproject.toml` | Add `evals/` to `testpaths` if eval fixtures are discovered by pytest |
| `ROADMAP.md` | Add governance and evals structure to Milestone 1 checklist |

---

## Dependencies

All from `TECH_STACK.md`. Define them all in `pyproject.toml` now even if not used until later phases.

```toml
[tool.poetry.dependencies]
python = "^3.12"

# API
fastapi = "^0.115"
uvicorn = {extras = ["standard"], version = "^0.30"}
pydantic = "^2.7"
pydantic-settings = "^2.3"

# Agent
langgraph = "^0.2"
langchain-openai = "^0.2"
langchain-community = "^0.3"

# Azure
azure-identity = "^1.17"
azure-monitor-query = "^1.3"
azure-search-documents = "^11.6"
azure-storage-blob = "^12.20"
azure-keyvault-secrets = "^4.8"

# Database
sqlalchemy = "^2.0"
alembic = "^1.13"
asyncpg = "^0.29"

# Cache
redis = {extras = ["asyncio"], version = "^5.0"}

# Observability
opentelemetry-sdk = "^1.25"
opentelemetry-instrumentation-fastapi = "^0.46"
structlog = "^24.2"

[tool.poetry.group.dev.dependencies]
pytest = "^8.2"
pytest-asyncio = "^0.23"
httpx = "^0.27"
ruff = "^0.4"
mypy = "^1.10"
```

---

## Implementation Notes

### `apps/api/auth/dependencies.py`

```python
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader

_api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def require_auth(api_key: str | None = Security(_api_key_header)) -> None:
    """FastAPI dependency — raises 401 when auth is not satisfied."""
    from packages.config.settings import get_settings
    settings = get_settings()
    if getattr(settings, "auth_disabled", True):
        return  # local dev: auth bypassed
    if not api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing API key")
```

### `apps/api/middlewares/correlation_id.py`

```python
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
import structlog

class CorrelationIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        cid = request.headers.get("X-Correlation-ID") or str(uuid.uuid4())
        structlog.contextvars.bind_contextvars(correlation_id=cid)
        response = await call_next(request)
        response.headers["X-Correlation-ID"] = cid
        structlog.contextvars.unbind_contextvars("correlation_id")
        return response
```

### `packages/governance/policies/agent_policy.py`

Runtime policy constants. Agents check these before executing restricted actions.

```python
# Which agents are permitted to write code to source control
AGENTS_ALLOWED_TO_PUSH_CODE: frozenset[str] = frozenset({"pr_agent"})

# Which agents are permitted to create external work items
AGENTS_ALLOWED_TO_CREATE_BUGS: frozenset[str] = frozenset({"bug_creator"})

# Hard limits
MAX_PATCH_SIZE_LINES: int = 500
AUTO_MERGE_ENABLED: bool = False     # never auto-merge — humans always approve
AUTO_DEPLOY_ENABLED: bool = False    # never auto-deploy — humans always approve
```

---

## Acceptance Criteria

- [ ] `poetry install` completes with no errors
- [ ] `docker compose config` validates successfully
- [ ] `python -c "from apps.api.main import app; print('OK')"` prints `OK`
- [ ] `python -c "from apps.api.auth.dependencies import require_auth; print('OK')"` prints `OK`
- [ ] `python -c "from packages.governance.guardrails.pii_scrubber import scrub; print('OK')"` prints `OK`
- [ ] `python -c "from packages.integrations.pii_scrubber import scrub; print('OK')"` prints `OK` (shim backward compat)
- [ ] `pytest tests/unit/` — all existing tests pass (no regressions from moves)
- [ ] `ruff check .` — exits 0, no violations
- [ ] `mypy apps/ packages/ --strict` — exits 0, no errors
- [ ] All new directories listed in "Files to Create" exist on disk
- [ ] `evals/datasets/`, `evals/suites/`, `evals/reports/` exist

---

## Out of Scope

- `tools/mcp_servers/` — MCP server adapters (future phase, not needed now)
- `routes/registry.yaml` — FastAPI routers are the capability contract; no YAML duplication
- Renaming `packages/agent_runtime/` — would break 30+ imports for zero functional benefit

---

## Commit Message

```
refactor(structure): align project layout with enterprise GenAI pattern

- Extract auth into apps/api/auth/dependencies.py
- Extract correlation ID middleware into apps/api/middlewares/
- Create packages/governance/ with guardrails/ and policies/ subdirectories
- Move pii_scrubber to packages/governance/guardrails/; shim old import path
- Add agent_policy.py with MAX_PATCH_SIZE_LINES, AUTO_MERGE_ENABLED constants
- Create evals/datasets/, evals/suites/, evals/reports/ directory structure
- No logic changes; all existing tests pass
```

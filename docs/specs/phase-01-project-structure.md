# Phase 1 - Project Structure and Application Scaffold

## Goal

Define and implement the canonical RemediAI repository scaffold, including:
- Python project configuration
- containerized local development wiring
- FastAPI application shell with core middleware and auth dependency structure
- governance package structure
- evaluation directory structure
- baseline test and quality tool configuration

This specification is the source of truth for repository layout and scaffold behavior.

## Deliverables

### 1) Root-level project files

Create and maintain these root files as part of the base scaffold:
- README.md
- SPEC.md
- ARCHITECTURE.md
- AGENT_DESIGN.md
- TECH_STACK.md
- SECURITY_GUARDRAILS.md
- ROADMAP.md
- CONTRIBUTING.md
- SECURITY.md
- LICENSE
- pyproject.toml
- docker-compose.yml
- Makefile
- alembic.ini

### 2) Canonical repository directory structure

The repository structure is:

```text
remediai/
├── apps/
│   ├── api/
│   │   ├── auth/
│   │   ├── core/
│   │   ├── middlewares/
│   │   ├── routers/
│   │   ├── schemas/
│   │   └── main.py
│   ├── worker/
│   │   ├── agents/
│   │   ├── ingestion/
│   │   └── main.py
│   ├── dashboard/
│   ├── docs/
│   └── log_bridge/
├── packages/
│   ├── agent_runtime/
│   ├── config/
│   ├── data_access/
│   ├── domain/
│   ├── governance/
│   │   ├── guardrails/
│   │   └── policies/
│   ├── integrations/
│   ├── observability/
│   └── search/
├── docs/
│   ├── architecture/
│   ├── product/
│   ├── prompts/
│   ├── references/
│   ├── runbooks/
│   └── specs/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── agent-evals/
├── evals/
│   ├── datasets/
│   ├── suites/
│   └── reports/
├── infrastructure/
│   ├── helm/
│   ├── terraform/
│   └── k8s/
├── pipelines/
│   └── azure-devops/
├── alembic/
│   └── versions/
└── scripts/
```

### 3) FastAPI scaffold contract

Implement API scaffolding with these structure constraints:

- apps/api/main.py initializes FastAPI app instance and lifecycle hooks
- apps/api/auth/dependencies.py contains require_auth dependency
- apps/api/middlewares/correlation_id.py contains correlation ID middleware
- apps/api/main.py registers CorrelationIdMiddleware via app.add_middleware(...)
- apps/api/main.py applies auth dependency to protected routers
- apps/api/core/auth.py exists as compatibility import shim to apps/api/auth/dependencies.py

Health endpoint contract:
- Route: GET /health
- Response JSON includes status with value ok
- Response may include additional metadata fields (for example version and environment)

### 4) Governance package contract

Implement governance package layout:

- packages/governance/guardrails/pii_scrubber.py exports scrub functionality
- packages/governance/policies/agent_policy.py defines runtime policy constants
- packages/integrations/pii_scrubber.py acts as a compatibility shim importing from packages/governance/guardrails/pii_scrubber.py

Policy constants contract:
- AGENTS_ALLOWED_TO_PUSH_CODE
- AGENTS_ALLOWED_TO_CREATE_BUGS
- MAX_PATCH_SIZE_LINES
- AUTO_MERGE_ENABLED
- AUTO_DEPLOY_ENABLED

### 5) Evaluation layout contract

Keep both of these structures:
- tests/agent-evals/ for executable pytest-based eval harness and fixture-driven tests
- evals/datasets, evals/suites, evals/reports for top-level evaluation artifacts and organization

### 6) Python project and quality tooling contract

Configure pyproject.toml with:
- Poetry package metadata
- Python 3.12 target
- FastAPI, Pydantic v2, SQLAlchemy, Alembic, LangGraph, Azure SDK dependencies
- Development dependencies including pytest, ruff, mypy
- pytest testpaths including:
  - tests/unit
  - tests/integration
  - tests/agent-evals
- mypy strict mode enabled
- Ruff lint configuration enabled

## Security Touchpoints

- No secrets are hardcoded in scaffold files.
- Authentication dependency exists at API boundary and is consistently attachable via FastAPI Depends.
- PII scrubber location is canonicalized under packages/governance/guardrails.
- Governance policy constants are centralized in packages/governance/policies/agent_policy.py.
- Project scaffold does not include any direct production-change or auto-merge behavior.

## Acceptance Criteria

- poetry install completes successfully.
- docker compose config validates successfully.
- python -c "from apps.api.main import app; print('OK')" prints OK.
- python -c "from apps.api.auth.dependencies import require_auth; print('OK')" prints OK.
- python -c "from packages.governance.guardrails.pii_scrubber import scrub; print('OK')" prints OK.
- python -c "from packages.integrations.pii_scrubber import scrub; print('OK')" prints OK.
- GET /health responds with JSON containing status: ok.
- pytest tests/unit executes successfully.
- ruff check . exits 0.
- mypy apps/ packages/ --strict exits 0.
- All canonical directories in this specification exist on disk.

## Out of Scope

- Renaming packages/agent_runtime to alternate naming schemes.
- Introducing tools/mcp_servers or MCP adapter topology in this phase.
- Implementing business-domain features beyond scaffold contracts.
- Creating production deployment infrastructure changes beyond baseline repository structure.

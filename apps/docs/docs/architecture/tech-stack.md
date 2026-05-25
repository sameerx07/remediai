---
sidebar_position: 4
title: Technology Stack
---

# Technology Stack

Full stack table with rationale for every technology choice.

---

## Layer summary

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Backend API | Python 3.12 + FastAPI | Async-native, Pydantic-first, strong Azure SDK support |
| Agent Worker | Python 3.12 | Consistent with API; rich AI/ML ecosystem |
| Agent Orchestration | LangGraph | Stateful, graph-based agent workflows; native LangChain compat |
| AI Platform | Azure AI Foundry / Azure OpenAI GPT-4o | Enterprise SLA, data residency, Managed Identity auth |
| RAG | Azure AI Search (hybrid) | Integrated vector + keyword search; Azure-native |
| Log Source | Application Insights / Azure Monitor KQL | Target platform for MVP |
| Message Queue | Azure Service Bus (Standard/Premium) | Dead-letter queues, sessions, Azure-native retry |
| Database | PostgreSQL 16 (Azure Flexible Server) | Reliable relational store; JSONB for flexible agent outputs |
| Cache | Redis (Azure Cache for Redis) | API response caching; deduplication state |
| Storage | Azure Blob Storage | Evidence bundles, prompt files, large agent artifacts |
| Source Control | Azure DevOps Repos (Git) | MVP target; code context and PR creation |
| Work Items | Azure DevOps Boards | Bug creation and work item tracking |
| UI Framework | React 18 + TypeScript | Component ecosystem; type safety |
| UI Build | Vite | Fast dev server; ESM-native |
| UI State | React Query (TanStack Query) | Server state management; cache + refetch |
| Containerization | Docker | Consistent build and deploy artifacts |
| Orchestration | AKS (Azure Kubernetes Service) | Production hosting; Workload Identity; KEDA scaling |
| Autoscaling | KEDA | Event-driven scaling off Service Bus queue depth |
| Secrets | Azure Key Vault | Central secret management; CSI driver mount to pods |
| Identity | Managed Identity / Workload Identity | No secret rotation; Azure-native zero-trust |
| Migrations | Alembic | Versioned PostgreSQL schema migrations |
| Testing | pytest + pytest-asyncio | Async test support; fixture-based |
| Linting | Ruff | Fast Python linter + formatter |
| Type Checking | mypy (strict) | End-to-end type safety |
| CI/CD | GitHub Actions + Azure DevOps Pipelines | Automated build, test, deploy |
| Observability | OpenTelemetry + Azure Monitor | Distributed tracing; structured logging |
| Metrics | Prometheus + Azure Managed Grafana | Pod-level and application metrics |
| Infrastructure | Terraform | Declarative Azure resource provisioning |
| Helm | Helm 3 | Kubernetes deployment packaging |

---

## Python dependencies (key)

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
azure-servicebus = "^7.12"
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
```

---

## Frontend dependencies (key)

```json
{
  "dependencies": {
    "react": "^18.3",
    "react-dom": "^18.3",
    "react-router-dom": "^6.24",
    "@tanstack/react-query": "^5.48",
    "axios": "^1.7",
    "recharts": "^2.12",
    "@radix-ui/react-dialog": "^1.1",
    "tailwindcss": "^3.4",
    "clsx": "^2.1"
  },
  "devDependencies": {
    "typescript": "^5.4",
    "vite": "^5.3",
    "vitest": "^1.6",
    "@testing-library/react": "^16.0",
    "eslint": "^9.6"
  }
}
```

---

## Local development stack

Local development uses Docker Compose to run stateful dependencies:

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: remediai
      POSTGRES_USER: remediai
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-change_me_locally}
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  servicebus-emulator:
    image: mcr.microsoft.com/azure-messaging/servicebus-emulator:latest
    ports:
      - "5671:5671"
      - "5672:5672"
```

Azure services (OpenAI, AI Search, DevOps, Monitor) are accessed via real Azure credentials. Use a dedicated non-production subscription for local development.

---

## Version pinning policy

- Pin **major and minor** versions for all production dependencies.
- Pin **major only** for dev/test tooling.
- `pip-audit` and `npm audit` run in CI on every PR.
- Dependabot is enabled for automated patch-level updates with PR review required.
- Docker base images are pinned by digest, not tag.
- No `latest` tags in production Helm values.

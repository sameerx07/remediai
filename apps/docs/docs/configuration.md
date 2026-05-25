---
id: configuration
title: Configuration Reference
sidebar_label: Configuration Reference
---

# Configuration Reference

All RemediAI configuration is loaded via `pydantic-settings` from environment variables. No configuration is hard-coded. In production, secrets come from Azure Key Vault via the CSI driver; non-secret config comes from Kubernetes ConfigMaps or environment variables in the Helm chart.

---

## Full variable reference

### Azure identity

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AZURE_TENANT_ID` | Yes | — | Azure AD tenant ID |
| `AZURE_CLIENT_ID` | Prod only | — | Managed Identity client ID (AKS) |
| `AZURE_CLIENT_SECRET` | Dev only | — | App registration secret (local dev only) |
| `AZURE_KEYVAULT_URL` | Yes | — | Key Vault endpoint URL |

---

### Application Insights / Azure Monitor

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AZURE_APP_INSIGHTS_CONNECTION_STRING` | Yes | — | Application Insights connection string |
| `AZURE_MONITOR_WORKSPACE_ID` | Yes | — | Log Analytics workspace resource ID |
| `INGESTION_POLL_INTERVAL` | No | `60` | Poll interval in seconds |
| `INGESTION_LOOKBACK_MINUTES` | No | `5` | Lookback window per poll cycle |
| `INGESTION_BATCH_SIZE` | No | `100` | Max exceptions per poll |

---

### Azure Service Bus

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AZURE_SERVICE_BUS_NAMESPACE` | Yes | — | Service Bus namespace FQDN |
| `AZURE_SERVICE_BUS_TOPIC` | No | `incident-events` | Topic name |
| `AZURE_SERVICE_BUS_SUBSCRIPTION` | No | `agent-worker` | Subscription name |
| `SERVICE_BUS_MAX_LOCK_DURATION` | No | `300` | Message lock duration in seconds |
| `SERVICE_BUS_MAX_CONCURRENT` | No | `5` | Max concurrent message processing |

---

### Azure OpenAI

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AZURE_OPENAI_ENDPOINT` | Yes | — | OpenAI resource endpoint |
| `AZURE_OPENAI_API_VERSION` | No | `2024-02-15-preview` | API version |
| `AZURE_OPENAI_DEPLOYMENT` | No | `gpt-4o` | Model deployment name |
| `AZURE_OPENAI_MAX_TOKENS` | No | `2048` | Max tokens per response |
| `AZURE_OPENAI_TEMPERATURE` | No | `0.1` | Sampling temperature |
| `AZURE_OPENAI_TIMEOUT` | No | `30` | Request timeout in seconds |
| `AZURE_OPENAI_MAX_RETRIES` | No | `3` | Retry attempts on 429 / 5xx |

---

### Azure AI Search

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AZURE_SEARCH_ENDPOINT` | Yes | — | Search service endpoint |
| `AZURE_SEARCH_INDEX` | No | `remediai-rag` | Index name |
| `RAG_TOP_K` | No | `10` | Results requested from Search |
| `RAG_MIN_SCORE` | No | `0.6` | Minimum relevance score to include |
| `RAG_MAX_RESULTS` | No | `5` | Max results passed to Fix Planner |

---

### Azure DevOps

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AZURE_DEVOPS_ORG_URL` | Yes | — | Organisation URL |
| `AZURE_DEVOPS_PROJECT` | Yes | — | Project name |
| `AZURE_DEVOPS_PAT` | Yes | — | PAT (from Key Vault at runtime) |
| `AZURE_DEVOPS_REPO_NAME` | Yes | — | Repository name for code context + PR |
| `AZURE_DEVOPS_DEFAULT_BRANCH` | No | `main` | Branch for PR base |
| `AZURE_DEVOPS_REVIEWER_GROUP` | No | — | ADO group added as PR reviewers |
| `AZURE_DEVOPS_CODE_ROOT` | No | — | Namespace prefix to filter stack frames |

---

### Database

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | SQLAlchemy async DSN |
| `DB_POOL_SIZE` | No | `10` | Connection pool size |
| `DB_MAX_OVERFLOW` | No | `20` | Max overflow connections |
| `DB_POOL_TIMEOUT` | No | `30` | Connection acquire timeout (seconds) |

Example: `postgresql+asyncpg://remediai:password@localhost:5432/remediai`

---

### Redis

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REDIS_URL` | Yes | — | Redis connection URL |
| `REDIS_CACHE_TTL` | No | `300` | Default cache TTL in seconds |
| `REDIS_DEDUP_TTL` | No | `3600` | Deduplication state TTL in seconds |

---

### Code Context Agent

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CODE_CONTEXT_MAX_SNIPPETS` | No | `5` | Max source snippets per incident |
| `CODE_CONTEXT_LINES_AROUND` | No | `20` | Context lines above/below target line |

---

### PR Agent

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DASHBOARD_BASE_URL` | No | — | Dashboard URL for PR description links |

---

### FastAPI

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `API_HOST` | No | `0.0.0.0` | Bind address |
| `API_PORT` | No | `8000` | Listen port |
| `API_WORKERS` | No | `1` | Uvicorn worker count |
| `API_RELOAD` | No | `false` | Enable hot reload (dev only) |
| `LOG_LEVEL` | No | `info` | Log level (`debug`, `info`, `warning`, `error`) |
| `CORS_ORIGINS` | No | `http://localhost:5173` | Allowed CORS origins (comma-separated) |

---

## Configuration validation

All settings are validated at startup by `pydantic-settings`. If a required variable is missing, the process exits immediately with a descriptive error:

```
pydantic_settings.ValidationError: 2 validation errors for Settings
AZURE_OPENAI_ENDPOINT
  Field required [type=missing, ...]
AZURE_DEVOPS_PAT
  Field required [type=missing, ...]
```

---

## Loading order

1. `.env` file (local development only)
2. Environment variables
3. Azure Key Vault secrets (mounted as files via CSI driver in production)

Variables from Key Vault take precedence over environment variables in production.

# Azure Pipeline Creator Agent

Generates production-grade Azure DevOps YAML pipelines for any project — monorepos, microservices, or single apps. Real pipelines that work on first run, following battle-tested patterns from production systems.

---

## Quick Start

1. Attach `azure-pipeline-creator.agent.md` in chat
2. Tell the agent what you need (see prompts below)
3. Agent scans your repo, detects structure, and generates complete pipelines

---

## Example Prompts

Copy-paste any of these into chat:

### Simple — Just build and push

```
Create Azure DevOps pipelines for my monorepo.
Frontend at root (Next.js), backend at ./backend (Express).
Just build Docker images and push to ACR — no Helm, no ArgoCD.
```

### Full stack with Terraform

```
Set up full CI/CD for this project. I have:
- API at ./apps/api (Python FastAPI)
- Frontend at ./apps/dashboard (React/Vite)
- Terraform at ./infra/azure
- Helm chart at ./helmchart
Deploy to AKS via ArgoCD.
```

### Single service

```
Create a build pipeline for my .NET API at ./src/API.
Push to myregistry.azurecr.io. Service connection is 'my-azure-connection'.
```

### QA pipeline

```
Set up a QA automation pipeline. I use Playwright for E2E tests.
It needs to spin up the full stack via docker-compose, wait for health checks,
run tests, and publish reports.
```

### Terraform only

```
Create a Terraform plan/apply pipeline for ./infra/azure.
Backend config at environments/dev.config, vars at environments/dev.tfvars.
Use Key Vault 'kv-myproject-dev' for service principal credentials.
```

---

## What It Generates

| Pipeline Type | When To Use |
|---|---|
| **Docker Build + ACR Push** | Any service with a Dockerfile |
| **Terraform Plan/Apply** | Infrastructure-as-code with environment gates |
| **Helm Deploy** | Kubernetes deployment (manual, ArgoCD-friendly) |
| **QA Automation** | E2E tests with Docker Compose local stack |
| **AI Agent Deploy** | Agent infrastructure deployment scripts |
| **Shared Templates** | Reusable steps (image-tag pinning, git commit) |

---

## Key Patterns

| Pattern | What It Does |
|---|---|
| AzureCLI@2 for ACR | Avoids Docker@2 MSI token exchange failures |
| Path triggers | Only builds what changed — separate pipeline per service |
| `set -e` everywhere | Fail fast, no silent errors |
| Build number tags | `20260706.1` — sortable, traceable, immutable |
| GitOps image pinning | Update Helm values → ArgoCD syncs automatically |
| Environment gates | Terraform apply requires approval |
| Dual QA profiles | Quick on PRs, extended on schedule |
| Failure diagnostics | Docker logs + test reports published on failure |

---

## Pipeline Placement Convention

Pipelines are placed **inside each service folder** (monorepo pattern):

```
my-project/
├── backend/
│   ├── azure-pipelines.yaml    ← backend pipeline here
│   ├── Dockerfile
│   └── src/
├── frontend/
│   ├── azure-pipelines.yaml    ← frontend pipeline here
│   ├── Dockerfile
│   └── app/
├── infra/
│   └── azure-pipelines.yaml    ← terraform pipeline here
└── helmchart/
    └── azure-pipelines-helm.yaml
```

For single-service projects, the pipeline goes at repo root.

---

## Files

| File | Purpose |
|---|---|
| `azure-pipeline-creator.agent.md` | Agent instructions — attach this in chat |
| `PIPELINE_PATTERNS.md` | Internal reference (agent reads this automatically) |
| `README.md` | This file — quick start + prompts |

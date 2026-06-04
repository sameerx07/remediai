# Enterprise GenAI — Project Folder Structure

This document describes the folder structure, purpose of each directory, and key files for the `enterprise-agent-platform` project.

---

## Top-Level Overview

```
enterprise-agent-platform/
├── README.md
├── CLAUDE.md
├── .env.example
├── agents/
│   ├── orchestrators/
│   │   ├── agent.py
│   │   └── policies.yaml
│   └── specialists/
│       ├── retrieval_agent/
│       ├── code_agent/
│       └── compliance_agent/
├── tools/
│   ├── registry.py
│   ├── definitions/
│   └── mcp_servers/
├── orchestrators/
│   ├── graph.py
│   ├── state.py
│   └── router.py
├── routes/
│   └── registry.yaml
├── api/
│   ├── routes/
│   ├── schemas/
│   ├── auth/
│   └── middlewares/
├── governance/
│   ├── policies/
│   ├── guardrails/
│   └── audit/
├── evals/
│   ├── datasets/
│   ├── suites/
│   └── reports/
├── tests/
│   ├── unit/
│   └── integration/
└── docs/
    └── architecture/
```

---

## Root Files

### `README.md`
Project overview, setup instructions, architecture summary, and development guidelines. The first file any new contributor should read.

### `CLAUDE.md`
AI coding assistant context file. Contains coding conventions, architecture rules, and development guidelines used to prime AI assistants (Claude, Copilot) when working on the codebase.

### `.env.example`
Template of all required configuration variables. Contains keys without values — copy to `.env` and populate before running locally. No secrets are stored here.

---

## `agents/`

Contains all AI agent implementations — both the orchestration layer and domain-specific specialist agents.

```
agents/
├── orchestrators/
│   ├── agent.py
│   └── policies.yaml
└── specialists/
    ├── retrieval_agent/
    ├── code_agent/
    └── compliance_agent/
```

### `agents/orchestrators/`
The core agent responsible for task decomposition, routing, and orchestration across specialist agents. Determines which specialist agents to invoke, in what order, and how to combine their outputs.

| File | Purpose |
|------|---------|
| `agent.py` | Main orchestrator agent logic — entry point for incoming tasks |
| `policies.yaml` | Routing policies, escalation rules, and agent selection criteria |

### `agents/specialists/`
Domain-specific agents that each perform a focused, well-scoped task. The orchestrator delegates work to these agents.

| Directory | Responsibility |
|-----------|---------------|
| `retrieval_agent/` | Fetches and ranks relevant context from vector stores, knowledge bases, or external APIs |
| `code_agent/` | Generates, reviews, and explains code; applies patches; interacts with source control |
| `compliance_agent/` | Validates outputs against regulatory, security, and policy guardrails before they are returned |

---

## `tools/`

Registry and implementation of all external tools, APIs, and integrations available to agents, including MCP (Model Context Protocol) servers.

```
tools/
├── registry.py
├── definitions/
└── mcp_servers/
```

| Path | Purpose |
|------|---------|
| `registry.py` | Central tool registry — maps tool names to implementations and validates schemas |
| `definitions/` | Tool schema definitions (JSON Schema / Pydantic) describing inputs, outputs, and permissions |
| `mcp_servers/` | MCP server adapters exposing tools to agents via the Model Context Protocol |

---

## `orchestrators/`

LangGraph workflow layer that defines the agent execution graph, shared state management, and routing logic between nodes.

```
orchestrators/
├── graph.py
├── state.py
└── router.py
```

| File | Purpose |
|------|---------|
| `graph.py` | Defines the LangGraph agent workflow — nodes, edges, and conditional transitions |
| `state.py` | Shared `AgentState` TypedDict — the data structure passed between all graph nodes |
| `router.py` | Routing logic — decides which node executes next based on current state |

> **Note:** This directory contains the LangGraph orchestration infrastructure, distinct from `agents/orchestrators/` which contains the high-level orchestrator agent logic.

---

## `routes/`

```
routes/
└── registry.yaml
```

| File | Purpose |
|------|---------|
| `registry.yaml` | Declares agent capabilities, exposed routes, and input/output contracts used by the API and orchestrator |

---

## `api/`

Central FastAPI layer managing HTTP routes, request/response schemas, authentication, and shared middleware.

```
api/
├── routes/
├── schemas/
├── auth/
└── middlewares/
```

| Directory | Purpose |
|-----------|---------|
| `routes/` | FastAPI routers — one file per domain area (agents, tasks, health, etc.) |
| `schemas/` | Pydantic request and response models shared across routes |
| `auth/` | Authentication and authorisation logic (API keys, JWT, RBAC) |
| `middlewares/` | Cross-cutting concerns: correlation IDs, logging, rate limiting, error handling |

---

## `governance/`

Safety, compliance, auditing, and guardrail mechanisms ensuring the platform operates within defined policies.

```
governance/
├── policies/
├── guardrails/
└── audit/
```

| Directory | Purpose |
|-----------|---------|
| `policies/` | Business and operational policy definitions (what agents can and cannot do) |
| `guardrails/` | Runtime safety checks applied to agent inputs and outputs (PII scrubbing, content filters, injection defence) |
| `audit/` | Immutable audit trail writers — records every agent decision, tool call, and state transition |

---

## `evals/`

Evaluation framework for measuring agent quality, safety, accuracy, and regression over time.

```
evals/
├── datasets/
├── suites/
└── reports/
```

| Directory | Purpose |
|-----------|---------|
| `datasets/` | Labelled evaluation fixtures — sample inputs with expected outputs |
| `suites/` | Test suites grouping related evaluations (accuracy, safety, latency, regression) |
| `reports/` | Generated evaluation reports — scores, diffs against baseline, failure analysis |

---

## `tests/`

Automated test suite ensuring correctness and reliability of all platform components.

```
tests/
├── unit/
└── integration/
```

| Directory | Purpose |
|-----------|---------|
| `unit/` | Unit tests for individual functions, agents, tools, and validators — mocked dependencies |
| `integration/` | Integration tests for end-to-end flows with real or near-real dependencies |

---

## `docs/`

Architecture documentation, design decisions, and Architecture Decision Records (ADRs).

```
docs/
└── architecture/
```

| Directory | Purpose |
|-----------|---------|
| `architecture/` | System diagrams, data flow documentation, component architecture, and ADRs explaining major design decisions |

---

## Design Principles

| Principle | How it is applied |
|-----------|------------------|
| **Separation of concerns** | Agents, tools, API, and governance are fully decoupled and independently testable |
| **Spec-driven** | `docs/specs/` and `tools/definitions/` act as contracts before implementation |
| **Human in the loop** | `governance/guardrails/` + `governance/policies/` gate all agent outputs before they are returned to users |
| **Auditable by default** | Every agent action is written to `governance/audit/` — no silent state changes |
| **Evaluation-first** | `evals/` is a first-class directory, not an afterthought — quality is measured continuously |

---

## Quick Reference

| I want to… | Look in… |
|------------|----------|
| Add a new specialist agent | `agents/specialists/` |
| Change orchestration routing logic | `orchestrators/router.py` or `agents/orchestrators/policies.yaml` |
| Register a new external tool | `tools/registry.py` + `tools/definitions/` |
| Add a new API endpoint | `api/routes/` + `api/schemas/` |
| Add a safety guardrail | `governance/guardrails/` |
| Write an evaluation suite | `evals/suites/` + `evals/datasets/` |
| Document an architecture decision | `docs/architecture/` |

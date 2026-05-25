---
sidebar_position: 1
title: Security Principles
---

# Security Principles

RemediAI is designed to operate safely in enterprise environments where AI-generated actions must be controlled, auditable, and reversible.

---

## Six core principles

### 1. Humans approve all code changes

No code is modified, committed, or merged without an explicit human approval event recorded in the database. The PR Agent can only run after a developer clicks **Approve** in the dashboard and confirms their identity.

This is enforced at two levels:
- **Database gate:** The `ApprovalEvent` must exist in the database before the PR Agent runs.
- **Draft PR:** The PR is always created as a draft with `autoComplete = false`. There is no way for RemediAI to merge a PR.

### 2. Least privilege everywhere

Every identity — Managed Identity, service account, or PAT — carries only the permissions it needs for its specific function:

- Log Ingestion: **Monitoring Reader** on Application Insights (read-only).
- Code Context Agent: **Read** on a single ADO repository (read-only).
- Bug Creation Agent: **Work Items Read & Write** on a single ADO project.
- PR Agent: **Code Read & Write** on a single ADO repository.
- No agent has admin, pipeline, or cross-project permissions.

### 3. Secrets never in code

All credentials flow through Azure Key Vault. No secrets appear in:
- Source code or Dockerfiles
- Helm values files
- CI/CD pipeline YAML
- `.env` files committed to the repository

The `detect-secrets` pre-commit hook blocks accidental secret commits.

### 4. PII masked before LLM

Exception payloads may contain personally identifiable information. Before any payload is sent to Azure OpenAI:

1. `pii_scrubber.scrub()` replaces emails, IPs, UUIDs, and SAS tokens with placeholder tokens.
2. The scrubbed text (never the original) is stored in PostgreSQL.
3. The scrubbing operation is recorded in the audit log.

See [PII Scrubbing](./pii-scrubbing) for the full pattern list.

### 5. Full audit trail

Every agent decision is recorded in the append-only `audit_log` table:
- Which agent ran
- What inputs it received (scrubbed summary)
- What decision it made
- Which LLM model and prompt version were used
- Timestamp

No `UPDATE` or `DELETE` is permitted on `audit_log` by application service accounts. The table is the immutable record of every automated action.

### 6. Defence in depth

Security controls operate at multiple layers:

| Layer | Controls |
|-------|---------|
| Network | Private AKS cluster, Private Endpoints for all Azure services, WAF on ingress, Network Policies between pods |
| Identity | Workload Identity, no stored credentials, Managed Identity per service |
| Data | PII scrubbing, TLS 1.2+, data residency enforcement |
| Application | Input validation via Pydantic, no raw SQL, no shell execution in agents |
| Supply chain | `pip-audit` + `npm audit` in CI, Dependabot, container image scanning |

---

## What RemediAI explicitly does NOT do

| Action | Why it is blocked |
|--------|------------------|
| Auto-merge PRs | PR is always a draft; `autoComplete` is never set |
| Direct production writes | Agents are read-only except for Bug creation and approved PR creation |
| Execute LLM-generated code | Agent tool calls are hard-coded; no dynamic code execution |
| Store raw PII | Scrubbing runs before PostgreSQL write and before LLM call |
| Retain LLM prompt/response | Prompts and responses are not stored; only structured outputs are persisted |

---

## Responsible disclosure

If you discover a security vulnerability in RemediAI, do **not** open a public GitHub issue. Report it privately via the process in [SECURITY.md](https://github.com/akeesari/remediai/blob/main/SECURITY.md).

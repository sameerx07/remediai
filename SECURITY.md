# Security Policy

## Supported Versions

RemediAI is currently in pre-release. Security fixes are applied to the `main` branch only.

| Version | Supported          |
| ------- | ------------------ |
| main    | Yes                |
| < 1.0   | No (pre-release)   |

---

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.**

To report a vulnerability privately:

1. Email **anjkeesari@gmail.com** with the subject line `[RemediAI] Security Vulnerability`.
2. Include as much of the following as possible:
   - Type of vulnerability (e.g., injection, authentication bypass, data exposure)
   - Location of the affected code (file path, line number, or URL)
   - Steps to reproduce the issue
   - Proof-of-concept or exploit code (if available)
   - Potential impact and severity assessment

We will acknowledge receipt within **2 business days** and provide a status update within **7 business days**.

---

## Scope

The following are **in scope** for security reports:

- RemediAI Python backend (`apps/api/`, `apps/worker/`)
- LangGraph agent pipeline (`packages/agent_runtime/`)
- React dashboard (`apps/dashboard/`)
- Azure infrastructure configuration (`infrastructure/`)
- Authentication and authorization logic
- PII scrubbing and data handling

The following are **out of scope**:

- Vulnerabilities in third-party dependencies (report those directly to the vendor)
- Azure platform vulnerabilities (report to Microsoft)
- Social engineering attacks
- Denial of service attacks on demo or sandbox environments

---

## Disclosure Policy

- We follow a coordinated disclosure model.
- We will work with you to understand and resolve the issue before any public disclosure.
- We ask that you allow us a reasonable remediation window (up to 90 days for complex issues) before publishing details.
- We will credit reporters in release notes unless anonymity is requested.

---

## Security Features

RemediAI is built with the following security controls. See [SECURITY_GUARDRAILS.md](SECURITY_GUARDRAILS.md) for full detail.

- **No hardcoded secrets** — all credentials via Azure Key Vault and Managed Identity
- **PII scrubbing** — exception payloads are scrubbed before LLM transmission
- **Human-in-the-loop** — no automated code merges; all changes require human approval
- **Least privilege** — each service identity holds only the permissions it needs
- **Audit trail** — every agent action is logged immutably
- **Network isolation** — private endpoints, AKS network policies, WAF on ingress
- **Dependency scanning** — `pip-audit` and `npm audit` run in CI on every PR

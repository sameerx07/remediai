---
slug: introducing-remediai
title: "Introducing RemediAI: AI-Powered Exception Remediation for .NET on Azure"
authors: [akeesari]
tags: [announcement, ai-agents, azure, dotnet, langgraph]
---

Engineering teams waste enormous amounts of time triaging the same recurring exception patterns. An alert fires, someone gets paged, they open Application Insights, correlate three dashboards, read a stack trace, manually create an Azure DevOps ticket, and repeat — for every exception, every day.

**RemediAI automates the entire investigation.** Today I'm sharing the platform we've built to solve this problem, and why we've open-sourced it.

<!-- truncate -->

## The problem

We're building enterprise .NET applications on Azure. Our applications generate exceptions. Those exceptions go to Application Insights. And then... a human has to find them, understand them, and create a work item.

The root cause analysis step is the hardest part. You need to:

1. Read the stack trace and understand which line actually caused the problem.
2. Find the relevant source file in your repository.
3. Understand what the code was trying to do.
4. Figure out why it failed.
5. Find any prior art — did someone fix the same bug before?
6. Write a clear bug report with repro steps.

That's 20–60 minutes of work for a single exception. Multiply by the number of exceptions in a production system.

## What RemediAI does

RemediAI ingests exceptions from Azure Monitor / Application Insights and runs a **LangGraph multi-agent pipeline** that does all of the above automatically:

```
1. Triage Agent        — assigns priority + semantic labels
2. Root Cause Agent    — structured JSON analysis with confidence score
3. Code Context Agent  — fetches the relevant source lines from Azure DevOps Repos
4. RAG Retrieval Agent — finds runbooks, docs, and prior fixes via Azure AI Search
5. Fix Planner Agent   — generates ranked remediation recommendations
6. Bug Creation Agent  — creates a fully-populated Azure DevOps Bug
```

The whole pipeline runs in under 3 minutes per incident.

## Human in the loop — always

One design decision I'm particularly proud of: **RemediAI never acts without human approval**.

Recommendations are surfaced in a React dashboard. An engineer reviews them. If they approve one, the PR Agent creates a **draft** pull request in Azure DevOps. The PR is never auto-merged.

This is the right design for an AI-powered tool touching production code. The agent does the investigation work; the human makes the decision.

## Security by design

A few principles we built in from day one:

- **PII scrubbing**: Exception messages can contain emails, IPs, and user IDs. `scrub()` strips all of that before any payload reaches Azure OpenAI.
- **Managed Identity everywhere**: No stored credentials in the cluster. Workload Identity Federation on AKS.
- **Immutable audit log**: Every agent decision is recorded in an append-only table. Every automated action is explainable.
- **Least privilege**: The Azure DevOps PAT has read-only access to Repos and write access to Boards — nothing else.

## The technology stack

The backend is Python 3.12 + FastAPI + LangGraph. The frontend is React 18 + TypeScript + TailwindCSS. Everything runs on Azure:

- Azure Monitor / Application Insights (log source)
- Azure Service Bus (incident queue)
- Azure OpenAI GPT-4o (agent reasoning)
- Azure AI Search (RAG index — hybrid keyword + vector)
- Azure DevOps Repos + Boards (code context, bug creation, PR creation)
- AKS + KEDA (hosting + autoscaling)
- Azure Key Vault (secrets — nothing else)

## Current status

We're at **v0.4** with 21 phases complete. The end-to-end flow — from Application Insights exception to Azure DevOps Bug and draft PR — is working. We're now working on the production hardening track: Terraform IaC, AKS deployment, Key Vault + Workload Identity, and load testing.

**v1.0 target: full production deployment on AKS** with all security controls, observability, and autoscaling in place.

## Try it

The project is open source under Apache 2.0.

- [GitHub: akeesari/remediai](https://github.com/akeesari/remediai)
- [Getting started guide](/docs/getting-started/prereqs)
- [Architecture overview](/docs/architecture/overview)

If you're running .NET applications on Azure and spending time on manual exception triage, I'd love to hear your feedback. Open an issue or start a discussion on GitHub.

---

*Anji Keesari — Principal Engineer*

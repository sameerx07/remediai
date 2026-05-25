---
sidebar_position: 3
title: Azure OpenAI
---

# Azure OpenAI

RemediAI uses Azure OpenAI GPT-4o for three agent reasoning tasks: triage labeling, root cause analysis, and fix planning. This page covers deployment setup, permissions, and prompt configuration.

---

## Required model deployment

| Model | Deployment name convention | Used by |
|-------|---------------------------|---------|
| `gpt-4o` | `gpt-4o` (or any name you set in env) | Triage, Root Cause, Fix Planner, Validation agents |

You must create the deployment in your Azure AI Foundry / Azure OpenAI resource before RemediAI can use it. A single `gpt-4o` deployment serves all agents.

---

## Creating the deployment

```bash
# Via Azure CLI (requires Azure AI Foundry resource)
az cognitiveservices account deployment create \
  --name <openai-resource-name> \
  --resource-group <rg> \
  --deployment-name gpt-4o \
  --model-name gpt-4o \
  --model-version "2024-11-20" \
  --model-format OpenAI \
  --sku-capacity 40 \
  --sku-name Standard
```

---

## Required role assignment

```bash
az role assignment create \
  --assignee <managed-identity-principal-id> \
  --role "Cognitive Services OpenAI User" \
  --scope /subscriptions/<sub-id>/resourceGroups/<rg>/providers/Microsoft.CognitiveServices/accounts/<openai-name>
```

---

## Environment variables

| Variable | Description | Example |
|----------|-------------|---------|
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI resource endpoint | `https://myoai.openai.azure.com/` |
| `AZURE_OPENAI_API_VERSION` | API version | `2024-02-15-preview` |
| `AZURE_OPENAI_DEPLOYMENT` | Deployment name | `gpt-4o` |
| `AZURE_OPENAI_MAX_TOKENS` | Max tokens per response (default: `2048`) | `2048` |
| `AZURE_OPENAI_TEMPERATURE` | Sampling temperature (default: `0.1`) | `0.1` |

:::tip Low temperature
RemediAI uses `temperature=0.1` for deterministic, structured JSON outputs. Higher temperatures increase variability and reduce JSON parse reliability.
:::

---

## PII scrubbing before every LLM call

Before any exception payload is sent to Azure OpenAI, `scrub()` from `packages.integrations.pii_scrubber` is called on both `exception_message` and `stack_trace`:

```python
from packages.integrations.pii_scrubber import scrub

safe_message = scrub(state["exception_message"])
safe_trace = scrub(state["stack_trace"])
payload = json.dumps({"exception_message": safe_message, "stack_trace": safe_trace})
```

See [PII Scrubbing](../security/pii-scrubbing) for the full replacement pattern list.

---

## Token usage tracking

Every LLM call records token usage in the `AgentTraceEntry`:

```json
{
  "agent_name": "root_cause",
  "llm_model": "gpt-4o",
  "tokens_used": 1847,
  "prompt_version": "root_cause_v1",
  "latency_ms": 3420
}
```

Token usage is aggregated in the dashboard metrics panel and stored in the `audit_log.metadata` JSONB column.

---

## Prompt versions

All prompts are stored as versioned Markdown files in `docs/prompts/`:

| File | Used by |
|------|---------|
| `docs/prompts/triage_v1.md` | Triage Agent |
| `docs/prompts/root_cause_v1.md` | Root Cause Agent |
| `docs/prompts/fix_planner_v1.md` | Fix Planner Agent |
| `docs/prompts/validation_v1.md` | Validation Agent |

To validate prompt contracts:

```bash
python scripts/validate_prompt_contracts.py
```

---

## Data residency

The Azure OpenAI deployment must be in the **same Azure region** as the AKS cluster. Cross-region data transmission is not permitted in the default configuration. Set the deployment region when creating the resource.

---

## Rate limits and throughput

| Configuration | Default |
|--------------|---------|
| TPM (tokens per minute) | Depends on quota — request increase for > 500 incidents/hr |
| Retry on 429 | 3 retries with exponential backoff (2s, 4s, 8s) |
| Timeout per call | 30 seconds |

For high-throughput environments (> 200 concurrent incidents), consider deploying a second Azure OpenAI instance in a separate region with Azure API Management load balancing.

---

## Troubleshooting

| Symptom | Check |
|---------|-------|
| `AuthenticationFailed` | Verify Managed Identity has `Cognitive Services OpenAI User` role |
| `DeploymentNotFound` | Check `AZURE_OPENAI_DEPLOYMENT` matches the deployment name exactly |
| JSON parse errors from LLM | Check `AZURE_OPENAI_TEMPERATURE` — use `0.1` or lower for structured outputs |
| Slow responses | Check TPM quota on the deployment; consider increasing capacity |

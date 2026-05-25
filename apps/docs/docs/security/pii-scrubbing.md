---
sidebar_position: 2
title: PII Scrubbing
---

# PII Scrubbing

Exception payloads can contain personally identifiable information — email addresses in error messages, IP addresses in request context, user IDs in stack traces. RemediAI scrubs all PII before any payload is transmitted to Azure OpenAI or stored in PostgreSQL.

---

## Where scrubbing runs

Scrubbing runs at **two points** in the pipeline:

1. **Before PostgreSQL write** — at ingestion, before the incident record is saved.
2. **Before every LLM call** — in each agent that calls Azure OpenAI.

```python
from packages.integrations.pii_scrubber import scrub

# Always scrub before JSON serialization for LLM
safe_message = scrub(state["exception_message"])
safe_trace = scrub(state["stack_trace"])
payload = json.dumps({"exception_message": safe_message, "stack_trace": safe_trace})
```

---

## Replacement patterns

| Pattern | Example input | Replacement |
|---------|--------------|-------------|
| Email address | `user@example.com` | `[EMAIL]` |
| IPv4 address | `192.168.1.42` | `[IP]` |
| IPv6 address | `2001:0db8::1` | `[IP]` |
| UUID (user ID pattern) | `userId=3fa85f64-5717-4562-b3fc-2c963f66afa6` | `userId=[USER_ID]` |
| Azure subscription ID | `subscriptionId/abc12345-...` | `subscriptionId/[SUB_ID]` |
| Azure SAS token | `?sv=2021&sig=...` | `[SAS_TOKEN]` |
| Credit card (16-digit) | `4111111111111111` | `[CARD]` |
| Bearer / API token | `Bearer eyJhbG...` | `Bearer [TOKEN]` |
| Windows file path with username | `C:\Users\john.doe\AppData` | `C:\Users\[USERNAME]\AppData` |

---

## Implementation

```python
import re

PII_PATTERNS = [
    (re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'), '[EMAIL]'),
    (re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b'), '[IP]'),
    (re.compile(r'\b([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b'), '[IP]'),
    (re.compile(r'Bearer\s+[A-Za-z0-9\-._~+/]+=*'), 'Bearer [TOKEN]'),
    (re.compile(r'\?sv=\d{4}[^&\s]*sig=[^\s&]+'), '[SAS_TOKEN]'),
    (re.compile(r'\b(?:userId|user_id|UserId)=?["\s]*'
                r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b',
                re.IGNORECASE), r'\1=[USER_ID]'),
    (re.compile(r'subscriptions/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-'
                r'[0-9a-f]{4}-[0-9a-f]{12}', re.IGNORECASE), 'subscriptions/[SUB_ID]'),
    (re.compile(r'\b4[0-9]{12}(?:[0-9]{3})?\b'), '[CARD]'),
    (re.compile(r'C:\\Users\\[^\\]+\\', re.IGNORECASE), r'C:\\Users\\[USERNAME]\\'),
]

def scrub(text: str) -> str:
    for pattern, replacement in PII_PATTERNS:
        text = pattern.sub(replacement, text)
    return text
```

---

## What is stored

| Data | Storage | PII scrubbed? |
|------|---------|--------------|
| `exception_message` | PostgreSQL `incidents` | Yes — before write |
| `stack_trace` | PostgreSQL `incidents` | Yes — before write |
| `raw_payload` | PostgreSQL `incidents.raw_payload` JSONB | Partially — IP and email fields only |
| LLM prompt content | Not stored | N/A — never persisted |
| LLM response content | Not stored | N/A — only structured outputs are kept |
| `root_cause_summary` | PostgreSQL `incident_analyses` | Uses scrubbed inputs |
| `agent_trace.input_summary` | PostgreSQL `audit_log` | Summary is generated from scrubbed fields |

---

## Audit of scrubbing

Each scrubbing operation is logged to the audit log:

```json
{
  "agent_name": "ingestion",
  "action": "pii_scrubbed",
  "output_summary": "Scrubbed 2 EMAIL, 1 IP from exception_message; 0 matches in stack_trace",
  "metadata": {
    "fields_scrubbed": ["exception_message"],
    "pattern_hits": { "EMAIL": 2, "IP": 1 }
  }
}
```

The original values are **never** logged.

---

## Extending the scrubber

To add a new PII pattern, add an entry to `PII_PATTERNS` in `packages/integrations/pii_scrubber.py` and add a test case in `tests/unit/test_pii_scrubber.py`:

```python
def test_custom_pattern():
    result = scrub("Employee ID: EMP-12345")
    assert "EMP-12345" not in result
```

Run tests:

```bash
pytest tests/unit/test_pii_scrubber.py -v
```

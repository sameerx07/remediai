---
sidebar_position: 7
title: Validation Agent
---

# Validation Agent

The Validation Agent inspects a draft pull request diff for obvious issues before a human reviewer sees it. It runs as part of the Phase 2 PR workflow.

---

## Responsibility

- Fetch the PR diff from Azure DevOps.
- Run static safety checks: syntax validation, no secrets introduced, diff within size limits.
- Call the LLM to review the diff for correctness and risk.
- Attach a validation report to the PR description.

---

## Trigger

The Validation Agent runs **after** the [PR Agent](./pr-agent) creates the draft PR. It does not require additional human input — it is part of the same Phase 2 pipeline run.

---

## Input fields

| Field | Source |
|-------|--------|
| `pr_url` | PR Agent output |
| `pr_branch` | PR Agent output |
| `recommendations` | The approved `Recommendation` item |

---

## Output fields

| Field | Type | Description |
|-------|------|-------------|
| `validation_report` | `dict` | Structured report (see below) |

---

## `validation_report` schema

```json
{
  "status": "passed",
  "checks": {
    "diff_size_ok": true,
    "no_secrets_detected": true,
    "syntax_valid": true,
    "llm_review_passed": true
  },
  "llm_review": {
    "summary": "The change correctly adds a null guard on the repository return value. No side effects detected. Logic matches the approved recommendation.",
    "risk_level": "low",
    "concerns": []
  },
  "generated_at": "2026-05-25T10:15:00Z"
}
```

| Status | Meaning |
|--------|---------|
| `passed` | All checks passed; PR is ready for human review |
| `warning` | LLM raised a non-blocking concern; reviewer should note |
| `failed` | A blocking check failed; PR is flagged and must be fixed |

---

## Static checks

| Check | Failure condition |
|-------|-----------------|
| `diff_size_ok` | Diff exceeds 500 lines changed |
| `no_secrets_detected` | `detect-secrets` scan finds a potential credential |
| `syntax_valid` | `dotnet build --no-restore` fails on the changed files |

If any static check fails, the report status is set to `failed` and the PR description is updated with the failure details. The incident status remains `pr_created` for manual resolution.

---

## LLM prompt

Prompt file: `docs/prompts/validation_v1.md`

The prompt instructs the model to:
- Review the diff line-by-line.
- Confirm the change matches the approved recommendation description.
- Flag any unintended side effects, logic errors, or security concerns.
- Assign `risk_level`: `low`, `medium`, or `high`.
- Never suggest changes to the diff — only report findings.

---

## Validation report in PR

The validation report is appended to the PR description as a collapsible section:

```markdown
---
## RemediAI Validation Report

**Status:** ✅ Passed  
**Risk level:** Low  
**Generated:** 2026-05-25 10:15 UTC  

<details>
<summary>Checks</summary>

- ✅ Diff size OK (12 lines changed)
- ✅ No secrets detected
- ✅ Syntax valid
- ✅ LLM review passed

**LLM review:** The change correctly adds a null guard on the repository return value. No side effects detected. Logic matches the approved recommendation.

</details>
```

---

## Agents do not execute code

The Validation Agent inspects diffs and runs static tools. It does **not** execute LLM-generated code or apply further changes. The diff is read-only from the agent's perspective.

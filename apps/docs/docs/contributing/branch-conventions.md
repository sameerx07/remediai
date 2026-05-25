---
sidebar_position: 2
title: Branch Conventions & PR Process
---

# Branch Conventions & PR Process

---

## Branch naming

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feature/` | New features | `feature/rag-retrieval-agent` |
| `fix/` | Bug fixes | `fix/fingerprint-null-stack-trace` |
| `chore/` | Maintenance, deps, tooling | `chore/bump-langgraph-0.3` |
| `docs/` | Documentation only | `docs/add-security-page` |
| `refactor/` | Code restructuring without behaviour change | `refactor/extract-pii-scrubber` |
| `test/` | Adding or improving tests | `test/root-cause-agent-evals` |

Branch names must be lowercase with hyphens. No uppercase, no spaces, no underscores.

---

## Commit message format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `perf`, `ci`

**Scopes:** `agent`, `api`, `dashboard`, `ingestion`, `integration`, `infra`, `security`, `docs`

**Examples:**

```
feat(agent): add root cause agent with structured JSON output

fix(ingestion): handle null stack trace in fingerprint hash
Previously the fingerprint computation would raise AttributeError
when stack_trace was None. Added empty string fallback.

docs(architecture): update component diagram with Phase 2 agents

chore(deps): bump langchain-openai from 0.2.3 to 0.2.8

test(agent): add eval fixtures for triage agent null-reference pattern
```

---

## Pull request process

1. **Branch from `main`** — always start from the latest `main`.

2. **Open a draft PR early** — get feedback on direction before completing the implementation.

3. **Fill in the PR template:**
   - Title (follows commit message format)
   - Summary: what changed and why
   - Test plan: what you tested and how

4. **Pass all CI checks:**
   - Lint and format (`ruff check . && ruff format --check .`)
   - Type check (`mypy --strict`)
   - Security scan (`detect-secrets`)
   - Tests (`pytest` — all must pass)
   - Frontend build (if dashboard changed)

5. **Request review** — convert from draft and request at least one review.

6. **At least 1 approving review** before merge.

7. **Squash and merge** into `main` — keep the commit history clean.

8. **Delete your branch** after merge.

---

## PR checklist

Before requesting review, confirm:

- [ ] Tests added or updated for the changed behaviour
- [ ] `mypy --strict` passes with no new errors
- [ ] `ruff check .` and `ruff format --check .` pass
- [ ] `make check-prompts` passes if you changed prompt files or agent behaviour
- [ ] No secrets or credentials committed (pre-commit hook should catch this)
- [ ] Documentation updated if behaviour changed (see [CONTRIBUTING.md](https://github.com/akeesari/remediai/blob/main/CONTRIBUTING.md) for the doc-sync table)
- [ ] CHANGELOG updated for user-facing changes

---

## GitHub branch protection

The `main` branch has the following protection rules:

- Require at least **1 approving review**
- Require status checks: `Lint and format`, `Typecheck`, `Security scan`, `Tests`, `Frontend build`
- Require branches to be **up to date** before merging
- Block direct pushes to `main`

---

## Copilot acceleration assets

The repository includes GitHub Copilot instructions to keep implementation consistent:

- **Repository policy:** `.github/copilot-instructions.md`
- **Scoped instruction layers:** `.github/instructions/`
- **Versioned prompt contracts:** `docs/prompts/*_v*.md`

Validate prompt contracts before committing agent changes:

```bash
make check-prompts
pytest tests/agent-evals/ -v
```

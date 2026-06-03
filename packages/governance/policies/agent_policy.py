"""Runtime agent policy constants (Phase 37 — Option C enforcement).

Agents import from here rather than hardcoding limits inline.
Changing a value here propagates to every agent that uses it.

Enforced by:
  - patch_builder.py        uses MAX_PATCH_SIZE_LINES
  - pr_agent/agent.py       checks AGENTS_ALLOWED_TO_PUSH_CODE
  - bug_creator/agent.py    checks AGENTS_ALLOWED_TO_CREATE_BUGS
"""

from __future__ import annotations

# Agents permitted to write code to source control
AGENTS_ALLOWED_TO_PUSH_CODE: frozenset[str] = frozenset({"pr_agent"})

# Agents permitted to create external work items (ADO, Jira, etc.)
AGENTS_ALLOWED_TO_CREATE_BUGS: frozenset[str] = frozenset({"bug_creator"})

# Maximum lines in a single generated patch — enforced by patch_builder
MAX_PATCH_SIZE_LINES: int = 500

# Auto-merge is never enabled — humans must always approve PRs
AUTO_MERGE_ENABLED: bool = False

# Auto-deploy is never enabled — humans must always approve deployments
AUTO_DEPLOY_ENABLED: bool = False

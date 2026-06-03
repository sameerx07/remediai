"""Runtime agent policy constants.

Agents check these before executing restricted actions so policy is enforced
in one place rather than scattered across individual agent implementations.
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

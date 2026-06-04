"""Unit tests for governance policy enforcement (Option C)."""

from __future__ import annotations

import pytest

from packages.agent_runtime.pr_agent.patch_builder import (
    _MAX_DIFF_LINES,
    PatchTooLargeError,
    build_patch,
)
from packages.governance.policies.agent_policy import (
    AGENTS_ALLOWED_TO_PUSH_CODE,
    AUTO_DEPLOY_ENABLED,
    AUTO_MERGE_ENABLED,
    MAX_PATCH_SIZE_LINES,
)


def test_auto_merge_disabled() -> None:
    assert AUTO_MERGE_ENABLED is False


def test_auto_deploy_disabled() -> None:
    assert AUTO_DEPLOY_ENABLED is False


def test_only_pr_agent_allowed_to_push() -> None:
    assert "pr_agent" in AGENTS_ALLOWED_TO_PUSH_CODE
    assert "triage" not in AGENTS_ALLOWED_TO_PUSH_CODE
    assert "root_cause" not in AGENTS_ALLOWED_TO_PUSH_CODE


def test_patch_builder_uses_policy_limit() -> None:
    assert _MAX_DIFF_LINES == MAX_PATCH_SIZE_LINES


def test_patch_too_large_raises_with_policy_limit() -> None:
    original = "\n".join(f"line {i}" for i in range(600)) + "\n"
    patched = "\n".join(f"changed {i}" for i in range(600)) + "\n"
    with pytest.raises(PatchTooLargeError):
        build_patch(original, patched, "src/Service.cs")


def test_small_patch_passes() -> None:
    original = "def foo():\n    return 1\n"
    patched = "def foo():\n    return 2\n"
    diff = build_patch(original, patched, "src/service.py")
    assert diff

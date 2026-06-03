"""Unit tests for the Post-Deploy Monitoring Agent (Phase 37)."""

from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest

from packages.agent_runtime.monitoring.agent import (
    AGENT_NAME,
    _derive_health_status,
    run_monitoring,
)


def _make_llm(summary: str = "Fix verified — no recurrence detected.") -> MagicMock:
    llm = MagicMock()
    llm.ainvoke = AsyncMock(return_value=MagicMock(content=summary))
    return llm


def _make_monitor(post_count: int = 0, baseline_count: int = 5) -> MagicMock:
    client = MagicMock()
    call_count = 0

    async def _fetch(*_a: object, **_kw: object) -> list:
        nonlocal call_count
        call_count += 1
        # First call = post-deploy window, second = baseline
        return [object()] * (post_count if call_count == 1 else baseline_count)

    client.fetch_exceptions_in_range = _fetch
    return client


# ── Health status derivation ─────────────────────────────────────────────────


def test_healthy_when_no_recurrence_and_rate_improved() -> None:
    assert _derive_health_status(False, 10.0, 2.0) == "healthy"


def test_unhealthy_when_exception_reoccurred() -> None:
    assert _derive_health_status(True, 10.0, 3.0) == "unhealthy"


def test_degraded_when_no_recurrence_but_rate_not_improved() -> None:
    assert _derive_health_status(False, 10.0, 8.0) == "degraded"


def test_inconclusive_when_no_data() -> None:
    assert _derive_health_status(False, 0.0, 0.0) == "inconclusive"


def test_healthy_when_post_rate_zero() -> None:
    assert _derive_health_status(False, 5.0, 0.0) == "healthy"


# ── Full agent runs ──────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_no_recurrence_resolves_incident() -> None:
    result, trace, new_status = await run_monitoring(
        incident_id="test-001",
        exception_type="NullReferenceException",
        exception_message="Object not set.",
        deployed_at=datetime.now(UTC),
        monitoring_window_minutes=30,
        monitor_client=_make_monitor(post_count=0, baseline_count=10),
        llm=_make_llm(),
    )
    assert result.exception_reoccurred is False
    assert result.health_status == "healthy"
    assert new_status == "resolved"
    assert trace.agent_name == AGENT_NAME


@pytest.mark.asyncio
async def test_recurrence_reopens_incident() -> None:
    result, trace, new_status = await run_monitoring(
        incident_id="test-002",
        exception_type="NullReferenceException",
        exception_message="Object not set.",
        deployed_at=datetime.now(UTC),
        monitoring_window_minutes=30,
        monitor_client=_make_monitor(post_count=3, baseline_count=5),
        llm=_make_llm(),
    )
    assert result.exception_reoccurred is True
    assert result.health_status == "unhealthy"
    assert new_status == "reopened"


@pytest.mark.asyncio
async def test_no_data_returns_inconclusive() -> None:
    result, trace, new_status = await run_monitoring(
        incident_id="test-003",
        exception_type="TimeoutException",
        exception_message="Timed out.",
        deployed_at=datetime.now(UTC),
        monitoring_window_minutes=30,
        monitor_client=_make_monitor(post_count=0, baseline_count=0),
        llm=_make_llm(),
    )
    assert result.health_status == "inconclusive"
    assert new_status == "analyzed"


@pytest.mark.asyncio
async def test_monitor_client_failure_returns_inconclusive() -> None:
    bad_client = MagicMock()
    bad_client.fetch_exceptions_in_range = AsyncMock(side_effect=RuntimeError("Azure unavailable"))

    result, trace, new_status = await run_monitoring(
        incident_id="test-004",
        exception_type="NullReferenceException",
        exception_message="Object not set.",
        deployed_at=datetime.now(UTC),
        monitoring_window_minutes=30,
        monitor_client=bad_client,
        llm=_make_llm(),
    )
    assert result.health_status == "inconclusive"
    # Client failures are handled gracefully inside _count_exceptions (returns 0, logs warning)
    # The agent completes without a top-level error — trace.error is None by design


@pytest.mark.asyncio
async def test_result_serialises_to_dict() -> None:
    result, _, _ = await run_monitoring(
        incident_id="test-005",
        exception_type="NullReferenceException",
        exception_message="Object not set.",
        deployed_at=datetime.now(UTC),
        monitoring_window_minutes=15,
        monitor_client=_make_monitor(post_count=0, baseline_count=4),
        llm=_make_llm("All clear."),
    )
    d = result.to_dict()
    assert "health_status" in d
    assert "exception_reoccurred" in d
    assert "monitoring_window_minutes" in d
    assert d["monitoring_window_minutes"] == 15


@pytest.mark.asyncio
async def test_trace_entry_contains_summary() -> None:
    _, trace, new_status = await run_monitoring(
        incident_id="test-006",
        exception_type="NullReferenceException",
        exception_message="Object not set.",
        deployed_at=datetime.now(UTC),
        monitoring_window_minutes=30,
        monitor_client=_make_monitor(post_count=0, baseline_count=8),
        llm=_make_llm(),
    )
    assert "health=" in trace.output_summary
    assert "status→" in trace.output_summary

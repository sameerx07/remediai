"""End-to-end pipeline tests — LangGraph pipeline compiled with mocked LLM and ADO client."""

from __future__ import annotations

import json
from unittest.mock import AsyncMock, MagicMock

import pytest
from langchain_core.messages import AIMessage

from packages.agent_runtime.pipeline import build_pipeline
from packages.domain.models.agent_state import IncidentState

# ---- Default LLM response payloads ----------------------------------------

_TRIAGE_JSON = json.dumps(
    {
        "priority": "high",
        "triage_labels": ["generic-error"],
        "group_id": None,
        "rationale": "No rule matched.",
        "confidence": 0.7,
    }
)

_RC_JSON = json.dumps(
    {
        "root_cause_summary": "Null reference in service layer when DB returns null.",
        "root_cause_json": {
            "component": "TestService.Process",
            "likely_cause": "Unguarded null return from repository.",
            "contributing_factors": ["Missing null check"],
            "confidence": 0.75,
        },
        "evidence": ["Top frame points to service layer"],
    }
)

_FP_JSON = json.dumps(
    {
        "recommendations": [
            {
                "rank": 1,
                "title": "Add null guard",
                "description": "Return 404 when user is missing.",
                "affected_files": ["svc.cs"],
                "suggested_change": "Add null check before mapping.",
                "confidence": 0.85,
                "source_refs": ["runbook:null"],
            }
        ]
    }
)


def _mock_llm(response_json: str = "") -> MagicMock:
    llm = MagicMock()
    llm.ainvoke = AsyncMock(return_value=AIMessage(content=response_json or _RC_JSON))
    return llm


def _mock_llm_sequence(*responses: str) -> MagicMock:
    llm = MagicMock()
    llm.ainvoke = AsyncMock(side_effect=[AIMessage(content=r) for r in responses])
    return llm


def _mock_ado(content: str | None = None, commit_sha: str = "deadbeef") -> MagicMock:
    ado = MagicMock()
    ado.repository = "test-repo"
    ado.get_file_content = AsyncMock(return_value=content)
    ado.get_latest_commit_sha = AsyncMock(return_value=commit_sha)
    return ado


def _mock_search() -> MagicMock:
    search = MagicMock()
    search.search = AsyncMock(return_value=[])
    return search


def _mock_repos_writer() -> MagicMock:
    writer = MagicMock()
    writer.repository = "test-repo"
    writer.default_branch = "main"
    writer.get_latest_commit_sha = AsyncMock(return_value="a" * 40)
    writer.create_branch = AsyncMock(return_value=None)
    writer.push_patch = AsyncMock(return_value=None)
    writer.create_pull_request = AsyncMock(
        return_value={
            "pullRequestId": 123,
            "_links": {"web": {"href": "https://dev.azure.com/org/proj/_git/repo/pullrequest/123"}},
        }
    )
    return writer


def _mock_pr_reader(diff_text: str = "") -> MagicMock:
    reader = MagicMock()
    reader.get_pr_diff = AsyncMock(return_value=diff_text)
    reader.append_validation_report = AsyncMock(return_value=None)
    return reader


def _make_initial_state(**overrides: object) -> IncidentState:
    base: IncidentState = {
        "incident_id": "pipeline-test-001",
        "correlation_id": "corr-pipeline",
        "exception_type": "System.NullReferenceException",
        "exception_message": "Object reference not set to an instance of an object.",
        "stack_trace": "at OrderService.Process() in OrderService.cs:line 100",
        "raw_payload": {},
        "agent_trace": [],
        "errors": [],
        "triage_labels": [],
    }
    base.update(overrides)  # type: ignore[typeddict-item]
    return base


class TestPipelineEndToEnd:
    @pytest.mark.asyncio
    async def test_pipeline_runs_all_nodes(self) -> None:
        pipeline = build_pipeline(
            llm=_mock_llm_sequence(_RC_JSON, _FP_JSON),
            ado_client=_mock_ado(),
            search_client=_mock_search(),
        )
        result: IncidentState = await pipeline.ainvoke(_make_initial_state())

        assert result.get("priority") is not None
        assert isinstance(result.get("triage_labels"), list)
        assert result.get("root_cause_summary") is not None
        assert isinstance(result.get("recommendations"), list)

    @pytest.mark.asyncio
    async def test_triage_rule_path_skips_triage_llm(self) -> None:
        llm = _mock_llm_sequence(_RC_JSON, _FP_JSON)
        pipeline = build_pipeline(
            llm=llm,
            ado_client=_mock_ado(),
            search_client=_mock_search(),
        )

        result: IncidentState = await pipeline.ainvoke(
            _make_initial_state(exception_type="System.NullReferenceException")
        )

        assert llm.ainvoke.await_count == 2  # root_cause + fix_planner
        assert result["priority"] == "high"
        assert "null-reference" in result["triage_labels"]

    @pytest.mark.asyncio
    async def test_llm_path_called_for_unknown_exception(self) -> None:
        llm = _mock_llm_sequence(_TRIAGE_JSON, _RC_JSON, _FP_JSON)
        pipeline = build_pipeline(
            llm=llm,
            ado_client=_mock_ado(),
            search_client=_mock_search(),
        )

        await pipeline.ainvoke(
            _make_initial_state(exception_type="MyApp.CompletelyUnknownException")
        )

        assert llm.ainvoke.await_count == 3

    @pytest.mark.asyncio
    async def test_agent_trace_has_five_entries(self) -> None:
        pipeline = build_pipeline(
            llm=_mock_llm_sequence(_RC_JSON, _FP_JSON),
            ado_client=_mock_ado(),
            search_client=_mock_search(),
        )
        result: IncidentState = await pipeline.ainvoke(_make_initial_state())

        trace = result.get("agent_trace", [])
        assert len(trace) == 5
        assert trace[0]["agent_name"] == "triage"
        assert trace[1]["agent_name"] == "root_cause"
        assert trace[2]["agent_name"] == "code_context"
        assert trace[3]["agent_name"] == "rag"
        assert trace[4]["agent_name"] == "fix_planner"
        assert all("latency_ms" in e for e in trace)

    @pytest.mark.asyncio
    async def test_critical_exception_priority_in_final_state(self) -> None:
        pipeline = build_pipeline(
            llm=_mock_llm_sequence(_RC_JSON, _FP_JSON),
            ado_client=_mock_ado(),
            search_client=_mock_search(),
        )
        result: IncidentState = await pipeline.ainvoke(
            _make_initial_state(exception_type="System.OutOfMemoryException")
        )
        assert result["priority"] == "critical"
        assert "resource-exhaustion" in result["triage_labels"]

    @pytest.mark.asyncio
    async def test_errors_empty_on_clean_run(self) -> None:
        pipeline = build_pipeline(
            llm=_mock_llm_sequence(_RC_JSON, _FP_JSON),
            ado_client=_mock_ado(),
            search_client=_mock_search(),
        )
        result: IncidentState = await pipeline.ainvoke(_make_initial_state())
        assert result.get("errors", []) == []

    @pytest.mark.asyncio
    async def test_all_llm_agents_fail_gracefully(self) -> None:
        """Triage, root_cause, fix_planner fail; code_context and rag succeed → 3 errors."""
        llm = MagicMock()
        llm.ainvoke = AsyncMock(side_effect=RuntimeError("Azure OpenAI unavailable"))
        pipeline = build_pipeline(
            llm=llm,
            ado_client=_mock_ado(),
            search_client=_mock_search(),
        )

        result: IncidentState = await pipeline.ainvoke(
            _make_initial_state(exception_type="Unknown.Error")
        )

        assert result["priority"] == "medium"
        assert "unknown" in result["triage_labels"]
        assert len(result.get("errors", [])) == 3

    @pytest.mark.asyncio
    async def test_root_cause_json_in_final_state(self) -> None:
        pipeline = build_pipeline(
            llm=_mock_llm_sequence(_RC_JSON, _FP_JSON),
            ado_client=_mock_ado(),
            search_client=_mock_search(),
        )
        result: IncidentState = await pipeline.ainvoke(_make_initial_state())

        rc = result.get("root_cause_json")
        assert rc is not None
        assert "component" in rc
        assert "confidence" in rc

    @pytest.mark.asyncio
    async def test_code_snippets_key_in_final_state(self) -> None:
        pipeline = build_pipeline(
            llm=_mock_llm_sequence(_RC_JSON, _FP_JSON),
            ado_client=_mock_ado(),
            search_client=_mock_search(),
        )
        result: IncidentState = await pipeline.ainvoke(_make_initial_state())
        assert "code_snippets" in result
        assert isinstance(result.get("code_snippets"), list)

    @pytest.mark.asyncio
    async def test_rag_results_key_in_final_state(self) -> None:
        pipeline = build_pipeline(
            llm=_mock_llm_sequence(_RC_JSON, _FP_JSON),
            ado_client=_mock_ado(),
            search_client=_mock_search(),
        )
        result: IncidentState = await pipeline.ainvoke(_make_initial_state())
        assert "rag_results" in result
        assert isinstance(result.get("rag_results"), list)

    @pytest.mark.asyncio
    async def test_recommendations_key_in_final_state(self) -> None:
        pipeline = build_pipeline(
            llm=_mock_llm_sequence(_RC_JSON, _FP_JSON),
            ado_client=_mock_ado(),
            search_client=_mock_search(),
        )
        result: IncidentState = await pipeline.ainvoke(_make_initial_state())
        assert "recommendations" in result
        assert isinstance(result.get("recommendations"), list)

    @pytest.mark.asyncio
    async def test_approved_path_populates_validation_report(self) -> None:
        pr_patch_json = json.dumps(
            {
                "patched_content": (
                    "public class Service {\n"
                    "  public void Run() {\n"
                    "    var x = gateway.Get();\n"
                    "    if (x == null) return;\n"
                    "    Console.WriteLine(x.Value);\n"
                    "  }\n"
                    "}\n"
                ),
                "files_changed": ["src/Service.cs"],
                "change_summary": "Added a null guard before dereference.",
            }
        )
        validation_json = json.dumps(
            {
                "risk_level": "low",
                "confidence": 0.86,
                "llm_assessment": "Patch is focused and aligned with root cause.",
                "reviewer_notes": "Confirm expected null path behavior.",
                "concerns": [],
            }
        )

        writer = _mock_repos_writer()
        pr_reader = _mock_pr_reader(
            diff_text=(
                "diff --git a/src/Service.cs b/src/Service.cs\n"
                "--- a/src/Service.cs\n"
                "+++ b/src/Service.cs\n"
                "@@ -2,4 +2,5 @@\n"
                "+if (x == null) return;\n"
            )
        )
        pipeline = build_pipeline(
            llm=_mock_llm_sequence(_RC_JSON, _FP_JSON, pr_patch_json, validation_json),
            ado_client=_mock_ado(
                content=(
                    "public class Service {\n"
                    "  public void Run() {\n"
                    "    var x = gateway.Get();\n"
                    "    Console.WriteLine(x.Value);\n"
                    "  }\n"
                    "}\n"
                )
            ),
            search_client=_mock_search(),
            ado_writer=writer,
            pr_reader=pr_reader,
        )

        result: IncidentState = await pipeline.ainvoke(
            _make_initial_state(
                approval_status="approved",
                approved_recommendation_rank=1,
            )
        )

        assert result.get("pr_url") is not None
        assert result.get("validation_report") is not None
        assert result["validation_report"]["overall_status"] == "approved"
        assert pr_reader.get_pr_diff.await_count == 1
        assert pr_reader.append_validation_report.await_count == 1

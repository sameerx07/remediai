from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from packages.domain.models.agent_state import IncidentState

_DEFAULT_TOP = 10
_MAX_TEXT_LEN = 1000


@dataclass
class SearchQuery:
    text: str
    vector_text: str
    filter_expr: str | None
    top: int = _DEFAULT_TOP


def build_search_query(state: IncidentState) -> SearchQuery:
    """Build a hybrid search query from the current pipeline state.

    Text query:  ``{exception_type} {component} {likely_cause}``
    Vector text: ``root_cause_summary`` (richer semantic signal for embeddings)
    Filter:      prefer ``prior_fix`` documents for this exception type
    """
    exception_type: str = state.get("exception_type", "") or ""
    root_cause_summary: str = state.get("root_cause_summary", "") or ""
    root_cause_json: dict[str, Any] = state.get("root_cause_json") or {}

    component: str = root_cause_json.get("component", "") or ""
    likely_cause: str = root_cause_json.get("likely_cause", "") or ""

    text_parts = [exception_type, component, likely_cause]
    text_query = " ".join(p for p in text_parts if p).strip()
    text_query = text_query[:_MAX_TEXT_LEN]

    vector_text = root_cause_summary[:_MAX_TEXT_LEN] if root_cause_summary else text_query

    filter_expr: str | None = None
    if exception_type:
        safe_type = exception_type.replace("'", "''")
        filter_expr = (
            f"(source_type eq 'prior_fix' and exception_type eq '{safe_type}') "
            "or source_type eq 'runbook'"
        )

    return SearchQuery(
        text=text_query or exception_type,
        vector_text=vector_text,
        filter_expr=filter_expr,
        top=_DEFAULT_TOP,
    )

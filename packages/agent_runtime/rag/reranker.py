from __future__ import annotations

from packages.agent_runtime.rag.models import RAGResult
from packages.domain.models.agent_state import IncidentState

_MAX_RESULTS = 5

# Higher value = higher priority in re-ranking
_SOURCE_TYPE_SCORE: dict[str, float] = {
    "prior_fix": 1.0,
    "runbook": 0.75,
    "documentation": 0.5,
    "source_code": 0.25,
}

_W_SEARCH = 0.5
_W_SOURCE = 0.3
_W_AFFINITY = 0.2


def rerank(results: list[RAGResult], state: IncidentState) -> list[RAGResult]:
    """Re-rank RAG results using a weighted combination of three signals.

    Weights:
      - Azure AI Search relevance score : 0.5
      - Source type priority            : 0.3
      - Exception type affinity         : 0.2

    Returns the top *_MAX_RESULTS* results with ``relevance_score`` updated to
    the weighted composite score.
    """
    exception_type: str = state.get("exception_type", "") or ""
    scored: list[tuple[float, RAGResult]] = []

    for result in results:
        raw_score = min(1.0, max(0.0, result.relevance_score))
        source_score = _SOURCE_TYPE_SCORE.get(result.source, 0.25)

        affinity_score = 0.0
        if exception_type and result.exception_type == exception_type:
            affinity_score = 1.0

        composite = _W_SEARCH * raw_score + _W_SOURCE * source_score + _W_AFFINITY * affinity_score
        scored.append((composite, result))

    scored.sort(key=lambda t: t[0], reverse=True)

    reranked: list[RAGResult] = []
    for composite_score, result in scored[:_MAX_RESULTS]:
        reranked.append(
            RAGResult(
                source=result.source,
                title=result.title,
                excerpt=result.excerpt,
                relevance_score=round(composite_score, 4),
                url=result.url,
                exception_type=result.exception_type,
            )
        )

    return reranked

from __future__ import annotations

import hashlib
import json
from typing import Any

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from packages.search.index_schema import SearchDocument

logger = structlog.get_logger()


async def index_prior_fixes(session: AsyncSession) -> list[SearchDocument]:
    """Query resolved incidents and return indexable prior-fix documents."""
    documents: list[SearchDocument] = []
    log = logger.bind(indexer="prior_fix")

    stmt = text(
        """
        SELECT
            i.id::text            AS incident_id,
            i.exception_type,
            ia.root_cause_summary,
            ia.recommendations
        FROM incidents i
        JOIN incident_analyses ia ON ia.incident_id = i.id
        WHERE i.status = 'resolved'
          AND ia.recommendations IS NOT NULL
          AND jsonb_array_length(ia.recommendations) > 0
        ORDER BY i.created_at DESC
        LIMIT 1000
        """
    )

    result = await session.execute(stmt)
    rows = result.mappings().all()
    log.info("prior_fix_index_start", row_count=len(rows))

    for row in rows:
        incident_id: str = row["incident_id"]
        exception_type: str = row["exception_type"] or ""
        root_cause_summary: str = row["root_cause_summary"] or ""
        recommendations_raw: Any = row["recommendations"]

        # Normalise recommendations to a list of dicts
        if isinstance(recommendations_raw, str):
            try:
                recommendations: list[Any] = json.loads(recommendations_raw)
            except (json.JSONDecodeError, ValueError):
                recommendations = []
        else:
            recommendations = list(recommendations_raw) if recommendations_raw else []

        top_rec = recommendations[0] if recommendations else {}
        top_rec_title = str(top_rec.get("title", ""))
        top_rec_desc = str(top_rec.get("description", ""))

        content_parts = [
            f"Exception: {exception_type}",
            f"Root cause: {root_cause_summary}",
            f"Fix applied: {top_rec_title}",
            top_rec_desc,
        ]
        content = "\n".join(p for p in content_parts if p).strip()

        if not content:
            continue

        chunk_id = hashlib.sha256(f"prior_fix::{incident_id}".encode()).hexdigest()[:32]
        documents.append(
            SearchDocument(
                id=chunk_id,
                source_type="prior_fix",
                title=f"Prior fix: {exception_type}",
                content=content,
                exception_type=exception_type or None,
            )
        )

    log.info("prior_fix_index_done", document_count=len(documents))
    return documents

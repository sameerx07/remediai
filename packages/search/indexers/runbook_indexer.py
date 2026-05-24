from __future__ import annotations

import hashlib
import re
from pathlib import Path

import structlog

from packages.search.chunker import chunk_text
from packages.search.index_schema import SearchDocument

logger = structlog.get_logger()


def _extract_title(text: str, fallback: str) -> str:
    match = re.search(r"^#\s+(.+)$", text, re.MULTILINE)
    return match.group(1).strip() if match else fallback


def index_runbooks(runbooks_dir: Path) -> list[SearchDocument]:
    """Read all *.md files under *runbooks_dir* and return indexable documents."""
    documents: list[SearchDocument] = []

    md_files = sorted(runbooks_dir.glob("*.md"))
    log = logger.bind(indexer="runbook", dir=str(runbooks_dir))
    log.info("runbook_index_start", file_count=len(md_files))

    for md_file in md_files:
        text = md_file.read_text(encoding="utf-8")
        title = _extract_title(text, fallback=md_file.stem)
        chunks = chunk_text(text)

        for idx, chunk in enumerate(chunks):
            source_id = f"runbook::{md_file.stem}"
            chunk_id = hashlib.sha256(f"{source_id}::chunk{idx}".encode()).hexdigest()[:32]
            documents.append(
                SearchDocument(
                    id=chunk_id,
                    source_type="runbook",
                    title=title,
                    content=chunk,
                    file_path=str(md_file.relative_to(runbooks_dir.parent.parent)),
                )
            )

    log.info("runbook_index_done", document_count=len(documents))
    return documents

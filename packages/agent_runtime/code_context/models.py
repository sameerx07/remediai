from __future__ import annotations

from pydantic import BaseModel


class CodeSnippet(BaseModel):
    file_path: str
    start_line: int
    end_line: int
    content: str
    repo: str
    commit_sha: str

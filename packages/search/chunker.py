from __future__ import annotations

import re

# 1 token ≈ 4 characters (rough approximation avoiding tiktoken dependency)
_CHARS_PER_TOKEN = 4


def _token_len(text: str) -> int:
    return max(1, len(text) // _CHARS_PER_TOKEN)


def chunk_text(
    text: str,
    max_tokens: int = 512,
    overlap: int = 50,
) -> list[str]:
    """Split *text* into overlapping chunks respecting Markdown heading boundaries.

    - Target chunk size: *max_tokens* tokens (≈ max_tokens * 4 chars).
    - Overlap: *overlap* tokens carried forward from the previous chunk.
    - Heading-aware: a ``##`` heading always starts a new chunk boundary.
    - Minimum chunk size: 100 tokens — trailing chunks smaller than this are discarded.
    """
    if not text or not text.strip():
        return []

    max_chars = max_tokens * _CHARS_PER_TOKEN
    overlap_chars = overlap * _CHARS_PER_TOKEN
    min_chars = 100 * _CHARS_PER_TOKEN

    # Split on Markdown ## headings, keeping the heading with the following content
    heading_pattern = re.compile(r"(?=^## )", re.MULTILINE)
    sections = heading_pattern.split(text)

    chunks: list[str] = []
    carry: str = ""  # overlap carried from previous chunk

    for section in sections:
        section = section.strip()
        if not section:
            continue

        # Combine carry-over text with this section
        block = (carry + "\n\n" + section).strip() if carry else section

        # If block fits in one chunk, keep it whole
        if len(block) <= max_chars:
            if len(block) >= min_chars:
                chunks.append(block)
                carry = block[-overlap_chars:] if overlap_chars > 0 else ""
            else:
                # Too small on its own: carry it into the next section
                carry = block
            continue

        # Block exceeds max_chars — split by characters with overlap
        pos = 0
        while pos < len(block):
            end = min(pos + max_chars, len(block))
            fragment = block[pos:end].strip()
            if len(fragment) >= min_chars:
                chunks.append(fragment)
                carry = fragment[-overlap_chars:] if overlap_chars > 0 else ""
            pos = end - overlap_chars if overlap_chars > 0 and end - overlap_chars > pos else end

    # Handle any remaining carry that didn't make it into a chunk
    if carry and len(carry) >= min_chars and (not chunks or chunks[-1] != carry):
        chunks.append(carry)

    return chunks

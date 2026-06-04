"""Parser for Python tracebacks.

Python tracebacks unwind bottom-up: the last frame listed is the throw site.
Each frame line matches:  File "path", line N, in function_name

Chain detection handles ``__cause__`` / ``__context__`` separators:
  - "During handling of the above exception, another exception occurred:"
  - "The above exception was the direct cause of the following exception:"
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

from packages.agent_runtime.language_internals import is_framework_internal

_FRAME_RE = re.compile(r'^\s*File\s+"([^"]+)",\s+line\s+(\d+),\s+in\s+(.+?)\s*$')

_CHAIN_SEPARATORS = frozenset(
    [
        "During handling of the above exception, another exception occurred:",
        "The above exception was the direct cause of the following exception:",
    ]
)


@dataclass
class PythonStackFrame:
    method: str
    file_path: str
    line_number: int
    is_user_code: bool = field(default=True)


@dataclass
class ParsedPythonTraceback:
    exception_type: str
    exception_message: str
    frames: list[PythonStackFrame]
    chained: list[ParsedPythonTraceback] = field(default_factory=list)


def parse_python_traceback(stack_trace: str) -> ParsedPythonTraceback | None:
    """Return a parsed traceback, or None if no Python traceback is detected."""
    if "Traceback (most recent call last):" not in stack_trace:
        return None
    return _parse_block(stack_trace.splitlines())


def _parse_block(lines: list[str]) -> ParsedPythonTraceback | None:
    """Parse a single traceback block from a list of lines."""
    frames: list[PythonStackFrame] = []
    exception_type = "Exception"
    exception_message = ""
    chained: list[ParsedPythonTraceback] = []

    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # Chain separator — parse the remainder as a chained traceback
        if stripped in _CHAIN_SEPARATORS:
            inner = _parse_block(lines[i + 1 :])
            if inner is not None:
                chained.append(inner)
            break

        frame_match = _FRAME_RE.match(line)
        if frame_match:
            file_path = frame_match.group(1)
            line_no = int(frame_match.group(2))
            func = frame_match.group(3)
            method = f"{file_path}::{func}"
            frames.append(
                PythonStackFrame(
                    method=method,
                    file_path=file_path,
                    line_number=line_no,
                    is_user_code=not is_framework_internal(file_path, "python"),
                )
            )
            i += 1
            continue

        # Code-context lines (indented) follow each frame header — skip them.
        # They show the actual source line that was executing, not frame metadata.
        if line.startswith(" ") or line.startswith("\t"):
            i += 1
            continue

        # The exception type+message line: unindented, appears after all frames.
        if frames and not stripped.startswith("Traceback"):
            exc_line = stripped
            # Exception format: "ExceptionType: message" or just "ExceptionType"
            colon_idx = exc_line.find(": ")
            if colon_idx != -1:
                exception_type = exc_line[:colon_idx].split(".")[-1]
                exception_message = exc_line[colon_idx + 2 :]
            else:
                exception_type = exc_line.split(".")[-1]
                exception_message = ""
            i += 1
            continue

        i += 1

    if not frames:
        return None

    return ParsedPythonTraceback(
        exception_type=exception_type,
        exception_message=exception_message.strip(),
        frames=frames,
        chained=chained,
    )


def get_user_frames(
    traceback: ParsedPythonTraceback, max_frames: int = 5
) -> list[PythonStackFrame]:
    """Return up to *max_frames* user-code frames (most inner first)."""
    user = [f for f in reversed(traceback.frames) if f.is_user_code]
    return (user or list(reversed(traceback.frames)))[:max_frames]

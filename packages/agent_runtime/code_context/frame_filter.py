from __future__ import annotations

from packages.agent_runtime.root_cause.stack_parser import StackFrame

_DENY_PREFIXES: tuple[str, ...] = (
    "Microsoft.AspNetCore.",
    "Microsoft.Extensions.",
    "System.",
    "lambda_method",
    "Microsoft.EntityFrameworkCore.",
)

_MAX_APP_FRAMES = 5
_FALLBACK_FRAMES = 3


def filter_frames(
    frames: list[StackFrame],
    path_prefix: str = "",
) -> list[StackFrame]:
    """Select application-code frames, excluding framework internals.

    1. Deny list: skip frames whose method starts with a known framework prefix.
    2. Allow list priority: frames whose file_path starts with *path_prefix* rank first.
    3. Limit: top *_MAX_APP_FRAMES* application frames after filtering.
    4. Fallback: if all frames are denied, take top *_FALLBACK_FRAMES* regardless.
    """
    qualifying = [
        f
        for f in frames
        if f.is_user_code and f.file_path is not None and f.line_number is not None
    ]

    # Apply deny list
    allowed = [f for f in qualifying if not _is_denied(f)]

    # Fallback if deny list removes everything
    if not allowed and qualifying:
        return qualifying[:_FALLBACK_FRAMES]

    # Prioritise frames under the configured source path prefix
    if path_prefix:
        priority = [f for f in allowed if f.file_path and f.file_path.startswith(path_prefix)]
        rest = [f for f in allowed if f not in priority]
        allowed = priority + rest

    return allowed[:_MAX_APP_FRAMES]


def _is_denied(frame: StackFrame) -> bool:
    method = frame.method or ""
    return any(method.startswith(prefix) for prefix in _DENY_PREFIXES)

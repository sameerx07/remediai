"""Correlation ID middleware — injects and propagates X-Correlation-ID on every request."""

from __future__ import annotations

import structlog.contextvars
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

_HEADER = "X-Correlation-ID"


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    """Extract X-Correlation-ID from the incoming request and bind it to the
    structlog context so all log lines within the request share the same ID.
    Echoes the ID back in the response header.
    """

    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(self, request: Request, call_next: object) -> Response:
        correlation_id = request.headers.get(_HEADER, "")
        structlog.contextvars.bind_contextvars(correlation_id=correlation_id)
        response: Response = await call_next(request)  # type: ignore[operator]
        if correlation_id:
            response.headers[_HEADER] = correlation_id
        structlog.contextvars.clear_contextvars()
        return response

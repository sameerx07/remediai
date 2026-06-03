"""Backward-compatibility shim — auth moved to apps.api.auth.dependencies."""

from apps.api.auth.dependencies import require_auth

__all__ = ["require_auth"]

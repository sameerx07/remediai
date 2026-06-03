"""Backward-compatibility shim — PII scrubber moved to packages.governance.guardrails."""

from packages.governance.guardrails.pii_scrubber import PiiScrubber, scrub

__all__ = ["PiiScrubber", "scrub"]

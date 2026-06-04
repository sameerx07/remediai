---
applyTo: "tests/**/*.py"
---

# Testing Rules

## Test Layout

| Directory | What belongs there |
|---|---|
| `tests/unit/` | Pure business logic — no I/O, no HTTP, no DB |
| `tests/integration/` | Azure clients, DB ORM — use mock clients, real schemas |
| `tests/agent-evals/` | Agent pipeline outputs — deterministic shape assertions only |
| `tests/e2e/` | Full stack with live services — never run in CI by default |

Never mix layers. A unit test that imports a SQLAlchemy model is an integration test.

## Agent Eval Rules

- Fixtures live in `tests/agent-evals/fixtures/` as `.json` files.
- Fixture data must be scrubbed — no real stack traces, emails, IPs, or user IDs.
- Use synthetic but structurally realistic data (real exception types, plausible file paths, fake org names).
- Assert on output **shape and safety**, not on exact LLM-generated strings:
  - ✅ `assert "root_cause" in result`
  - ✅ `assert 0.0 <= result["confidence"] <= 1.0`
  - ❌ `assert result["reasoning"] == "The null reference occurred because..."`
- Each agent must have at least one fixture for the happy path and one for the low-evidence / ambiguous case.
- The low-evidence fixture must assert that `confidence` is below a defined threshold (e.g., `< 0.4`).

## Mock Boundary Rules

- Mock at the **client boundary**, never inside business logic:
  - ✅ Mock `AzureMonitorClient.query_logs()`
  - ❌ Mock `TriageAgent._build_prompt()`
- Use `unittest.mock.AsyncMock` for all async client methods.
- Integration tests inject mock clients via constructor — never monkey-patch module globals.
- If a test needs to patch more than two things, it is testing the wrong layer.

## No Secrets in Tests

- Never hardcode API keys, connection strings, tenant IDs, or subscription IDs in test files.
- Use placeholder strings like `"fake-tenant-id"`, `"test-api-key"`, `"https://fake.monitor.azure.com"`.
- `detect-secrets` runs in CI — a real secret in a fixture will fail the pipeline.

## Pytest Conventions

- One test class per module under test; one test function per behavior.
- Name tests as `test_<function>_<scenario>`: e.g., `test_triage_agent_returns_low_confidence_on_empty_trace`.
- Use `pytest.mark.asyncio` for all async tests — do not use `asyncio.run()` inside tests.
- Use `pytest.fixture` with explicit scope (`function`, `module`) — never rely on implicit scoping.
- Parametrize with `@pytest.mark.parametrize` for input variation, not separate test functions.

## Coverage Requirements

- Every new agent node must have a unit test for its `_build_prompt()` and a shape assertion on its `_parse_response()`.
- Every new Pydantic model must have a test for invalid input rejection.
- Every new FastAPI endpoint must have an integration test asserting status code and response schema.
- Run `pytest tests/ -x -v --ignore=tests/e2e` before declaring any phase done.

## Structlog in Tests

- Do not assert on log output in unit tests — logs are operational, not behavioral contracts.
- If a test must verify that a log was emitted (e.g., audit log), assert on the DB record, not the log string.

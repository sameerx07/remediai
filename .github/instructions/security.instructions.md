---
applyTo: "apps/api/**/*.py"
---

# API Security Rules

These rules apply to every FastAPI router, dependency, middleware, and schema in `apps/api/`.

## Authentication

- Every router that is not `/health` or `/metrics` must declare an explicit auth dependency.
- Use FastAPI `Depends()` to inject the auth guard — never check tokens inside route functions directly.
- Return `401 Unauthorized` for missing or invalid credentials; `403 Forbidden` for valid credentials with insufficient scope.
- Never return auth error details that reveal whether a user exists, a token is expired, or a scope is missing — use a generic message.

## Input Validation

- All request bodies must be Pydantic v2 models — never accept raw `dict` or `Any`.
- Validate and bound all pagination parameters: `limit` must have a maximum (e.g., 100); `offset` must be non-negative.
- Reject requests with unexpected fields by setting `model_config = ConfigDict(extra="forbid")` on request models.
- Never pass raw query string values into SQLAlchemy queries — always use ORM or parameterized expressions.

## Response Sanitization

- Response models must be explicit Pydantic models — never return ORM objects directly from route functions.
- Strip internal fields (`id` sequences, internal status enums, raw stack traces) from responses unless explicitly required by the API contract.
- Never include Python exception tracebacks in HTTP responses — log them server-side with `correlation_id` and return a sanitized error message.
- Set `model_config = ConfigDict(extra="ignore")` on response models to prevent accidental field leakage.

## Error Handling

- Use a global exception handler registered with `app.exception_handler()` for unhandled exceptions.
- All 5xx responses must include a `correlation_id` field so errors can be traced in logs.
- Do not expose internal service names, database table names, or file paths in error messages.
- Log the full exception with `structlog` at `ERROR` level server-side; return only a sanitized message to the client.

## Rate Limiting and Resource Protection

- Endpoints that trigger agent pipeline execution must be protected against concurrent abuse — add a concurrency guard or queue depth check before enqueuing work.
- Reject requests with a payload larger than a defined limit (e.g., 1 MB for ingestion endpoints).
- Any endpoint that performs a database write must be idempotent or document why it cannot be.

## Dependency Injection Security

- Azure client instances must be injected via `Depends()` — never instantiate them inside route functions.
- Credentials must come from `pydantic-settings` — never read `os.environ` directly in route code.
- Never expose the settings object or its fields in a response.

## OWASP Checklist (confirm before adding any new endpoint)

- [ ] Authentication dependency declared
- [ ] Request body is a typed Pydantic model with `extra="forbid"`
- [ ] Response model strips internal fields
- [ ] No raw exception detail in responses
- [ ] `correlation_id` included in all error responses
- [ ] Pagination bounds enforced
- [ ] No ORM objects returned directly

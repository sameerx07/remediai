# API Endpoint Creator

Generates production-ready ASP.NET Core API endpoints for any .NET project. Scans existing code to match conventions or uses battle-tested defaults from real production APIs (TradeSignal, SHAPE).

---

## Quick Start

1. Open your .NET project in any AI editor (Kiro, Copilot, Cursor, Claude Code)
2. Attach `api-endpoint-creator.agent.md` in chat — **only this one file**
3. Say: "Create a GET /api/v1/notifications endpoint"
4. Agent scans your project, generates all files matching your conventions

---

## How It Works

| Step | What Happens |
|---|---|
| 1. Scan | Reads your `.csproj`, controllers, models, `Program.cs` to detect patterns |
| 2. Spec (optional) | If you have an API spec doc, reads it for endpoint definitions |
| 3. Generate | Creates all files matching your project's exact conventions |

---

## What It Generates Per Endpoint

| File | Description |
|---|---|
| Controller action | Route, auth, parameters, response handling |
| Request DTO | Typed request body (POST/PUT/PATCH) |
| Response DTO | Typed response model |
| Validator | FluentValidation or DataAnnotations (matches project) |
| Service interface | Business logic contract |
| Service implementation | Business logic with logging |
| DI registration | Shows what to add to `Program.cs` |
| Repository method | If new data access is needed |
| Swagger example | If project uses `SwaggerExamples/` |

---

## Adapts to Your Project

The agent detects and follows your existing patterns:

- **Routing** — `v{version}/resource` or `api/v1/resource` or custom
- **Auth** — Azure AD, API Key, Auth0, policies, roles
- **Responses** — Raw objects or envelope wrappers
- **Errors** — Custom ApiErrorResponse or ProblemDetails
- **Validation** — FluentValidation, DataAnnotations, or manual
- **Serialization** — Newtonsoft.Json or System.Text.Json
- **Data access** — EF Core, Dapper, or raw SQL
- **Architecture** — Flat structure or Clean Architecture
- **Libraries** — MediatR (CQRS), AutoMapper, SignalR, Polly

---

## New Projects (No Existing Code)

For brand new projects, uses the best of TradeSignal (simplicity) + SHAPE (structure):

```
Structure:    Controllers/ Models/Requests/ Models/Responses/ Interfaces/ Services/ Validators/
Routing:      [Route("v{version:apiVersion}/{resource}")] + [ApiVersion("1.0")]
Auth:         [Authorize] on class, [AllowAnonymous] where needed
Serialization: Newtonsoft.Json + camelCase resolver + [JsonProperty]
Validation:   FluentValidation (separate validator per request DTO)
Responses:    Lists → envelope { data, meta }. Single items → direct return.
Errors:       ApiErrorResponse { Error, Code, Details, CorrelationId }
Controllers:  sealed, ILogger<T>, CancellationToken on all methods
Swagger:      [ProducesResponseType] + XML comments + <remarks>
Health:       /health/live + /health/ready
```

---

## Scenarios & Prompts

### Scenario 1: Existing project, no spec doc — you know what endpoint you want

```text
"Create a GET /api/v1/notifications endpoint"
"Scaffold a Payments controller with CRUD operations"
"Add a batch delete endpoint to the existing UsersController"
"Create a POST /v1/webhooks/stripe endpoint with signature validation"
```

Agent scans your existing code → generates endpoint matching your conventions.

---

### Scenario 2: Existing project, has a spec doc — generate from the doc

```text
"Generate all endpoints from docs/architecture/06-api-specification.md"
"Generate the Support module from the API spec"
"Read the spec doc at docs/api-spec.md and generate the Identity module"
```

Agent reads the doc for WHAT to build, scans code for HOW to build it.

---

### Scenario 3: New project, no existing code — start fresh

```text
"Scaffold a new API project with a Users controller"
"Create a notifications endpoint — this is a new project"
"Set up a CRUD controller for Products"
```

Agent uses TradeSignal/SHAPE best-practice defaults for folder structure, routing, error handling.

---

### Scenario 4: New project, has a spec doc — build from scratch using the doc

```text
"This is a new project. Generate endpoints from docs/api-specification.md"
"Read the spec and scaffold the full API from it"
```

Agent reads doc for WHAT to build, uses best-practice defaults for HOW.

---

### Scenario 5: Add to an existing endpoint or modify

```text
"Add pagination to the GET /v1/users endpoint"
"Add a search query parameter to the existing ScannersController"
"Refactor the QuotesController to use FluentValidation instead of manual checks"
```

---

### Scenario 6: Endpoint not in spec doc

```text
"Create a GET /api/v1/analytics/dashboard endpoint"
```

If a spec doc exists and this endpoint isn't in it, agent will:
1. Warn you: "This endpoint is not in the spec doc."
2. Offer to generate it anyway with a `// NOT IN SPEC` marker.
3. Generate it following the project's conventions if you confirm.

---

## Spec Doc Sync

If your project has an API spec doc (like SHAPE's `06-api-specification.md`), the agent supports syncing:

**Manual (any editor):**
```text
"Sync with spec"
"The spec was updated — generate the new endpoints"
```

**Automatic (Kiro only):**

A Kiro hook (`api-spec-sync`) watches `**/06-api-specification.md`. When the file is saved, the agent fires automatically — no manual trigger needed.

**What happens on sync:**
1. Agent reads the spec doc (latest version)
2. Compares against existing controllers
3. Detects new/changed endpoints
4. Generates only the delta — no duplicate code
5. Flags removals for review (never auto-deletes)

### Self-Updating Defaults

When the agent detects a new convention in the **SHAPE project's API spec** (`docs/architecture/06-api-specification.md`) that isn't in its baked-in defaults:

1. **Auto-adds it** to the agent.md file's defaults section
2. **Logs** what was added: "New convention added: {description}"
3. **All future new projects** (without their own spec) automatically get the updated standard

**Only the SHAPE API spec triggers self-updates.** Other projects' docs are used for generation but don't modify the agent's global defaults.

This means:
- SHAPE's API spec is the single source of truth for API conventions
- The agent keeps itself up to date from SHAPE
- No manual maintenance of the agent file needed
- Standards evolve in one place (SHAPE spec) and propagate to all new projects

Works with any spec doc format — just tell the agent where it is.

---

## Quality Standards (Always Enforced)

- Async all the way with CancellationToken
- No business logic in controllers
- Typed responses (never object/dynamic)
- Input validation on every mutation
- Structured logging on errors
- Sealed classes by default
- XML docs on all public actions
- No magic strings — constants for codes and roles

---

## Works With

- .NET 6, 7, 8+
- ASP.NET Core Web API
- EF Core / Dapper / ADO.NET
- FluentValidation / MediatR / AutoMapper
- Newtonsoft.Json / System.Text.Json
- Swashbuckle / NSwag
- Azure AD / Auth0 / API Key auth
- SignalR for real-time
- Any folder structure

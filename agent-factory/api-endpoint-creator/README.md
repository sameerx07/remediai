# API Endpoint Creator

Reads the SHAPE platform's canonical API specification (`docs/architecture/06-api-specification.md`) and generates production-ready ASP.NET Core endpoints — controllers, DTOs, validators, service interfaces, and authorization policies.

---

## Prerequisites

- The **SHAPE project repo** must be open in your workspace (the agent reads the API spec from the SHAPE repo directly)
- For auto-sync (Kiro hook), both the `remediai` and `shape` repos must be in the same multi-root workspace

---

## Quick Start

1. Open your project in any AI editor (Kiro, Copilot, Cursor, Claude Code)
2. Make sure the SHAPE repo is in your workspace
3. Attach `api-endpoint-creator.agent.md` in chat — **only this one file**
4. Send a short trigger: "Generate the Support module endpoints"
5. Agent reads the spec, asks at most 2 questions, then generates everything

---

## What It Generates

| Artefact | Description |
|---|---|
| Controllers | One controller per resource group with full routing, auth, and response handling |
| Request DTOs | Strongly typed request bodies with camelCase JSON serialization |
| Response DTOs | Response shapes matching the spec's envelope format |
| Validators | FluentValidation validators per request DTO |
| Service interfaces | Business logic contracts per module |
| Service implementations | Business logic calling repositories |
| Authorization policies | Policy definitions matching spec's role model |
| Error codes | Typed constants from the spec's error code registry |
| Middleware | Rate limiting, idempotency, tenant resolution |

---

## Key Features

- **Spec-driven** — `06-api-specification.md` is the single source of truth. Agent never freelances.
- **155 endpoints** across 17 modules — generate one module at a time or all at once.
- **Convention-compliant** — Response envelopes, error shapes, pagination, auth attributes all match the spec exactly.
- **Delta detection** — On re-run, detects what changed in the spec and generates only new/changed endpoints.
- **Multi-tenancy built in** — `organisation_id` always from `ICurrentTenant`, never from request body.

---

## Sync Across Editors

### Kiro (Automatic)

Configure a hook to watch `**/06-api-specification.md`. When the file is saved, the agent fires automatically.

### VS Code + GitHub Copilot (Manual)

1. Open the workspace with the SHAPE repo
2. In Copilot chat, attach `api-endpoint-creator.agent.md`
3. Send: `Generate the Support module endpoints` or `Sync with spec`

### Cursor (Manual)

1. In chat, reference `@api-endpoint-creator.agent.md`
2. Send: `Generate the Deployment module`

### Claude Code / CLI (Manual)

1. Reference the agent file
2. Send: `Sync with spec`

---

## Usage Examples

```text
# Full module generation
"Generate the Support module endpoints"

# Single endpoint
"Create the POST /api/v1/deployments endpoint"

# Shared infrastructure (run first)
"Generate shared infrastructure (auth policies, error codes, response envelopes)"

# Only validators
"Generate validators for the Commerce module"

# Only DTOs
"Generate DTOs for the Survey module"

# After spec update
"Sync with spec"
```

---

## Spec Update Workflow

When `06-api-specification.md` is updated:

1. **In Kiro:** Hook fires → agent syncs automatically
2. **Elsewhere:** Attach agent in chat → say "Sync with spec"

The agent will:
- Detect new endpoints → generate controller action + DTO + validator
- Detect changed auth rules → update `[Authorize]` attributes
- Detect new error codes → add to `ErrorCodes` constants
- Flag removals for review (never auto-deletes endpoints)

---

## Output Structure

```
src/
├── API/
│   ├── Controllers/
│   │   ├── Identity/          (UsersController, OrganisationsController, MembershipsController)
│   │   ├── RBAC/              (RolesController, UserRolesController)
│   │   ├── Creator/           (CreatorProfilesController, ServicesController, PackagesController)
│   │   ├── Commerce/          (StoreListingsController, SubscriptionsController, ...)
│   │   ├── Deployment/        (DeploymentsController, AudiencesController, ...)
│   │   ├── Survey/            (SchedulesController, RoundsController, ...)
│   │   ├── Reporting/         (ReportsController, ReportAccessController)
│   │   ├── Support/           (SupportTicketsController, TicketMessagesController)
│   │   ├── Chat/              (ChatSessionsController, ChatMessagesController)
│   │   ├── Notifications/     (NotificationTemplatesController, NotificationLogController)
│   │   ├── Audit/             (AuditEventsController)
│   │   ├── Search/            (SearchController)
│   │   ├── Webhooks/          (StripeWebhookController, SendGridWebhookController)
│   │   └── Admin/             (PlatformAdminController, CreatorAdminController, ...)
│   ├── Contracts/
│   │   ├── Requests/{Module}/
│   │   └── Responses/{Module}/
│   ├── Validators/{Module}/
│   ├── Authorization/         (Policies.cs, AuthorizationExtensions.cs)
│   ├── Errors/                (ErrorCodes.cs, ApiErrors.cs)
│   └── Middleware/            (RateLimitMiddleware, IdempotencyMiddleware, TenantResolutionMiddleware)
└── Application/
    ├── Interfaces/{Module}/   (Service interfaces)
    └── Services/{Module}/     (Service implementations)
```

---

## Module Inventory (from spec)

| Module | Endpoints | Primary Resources |
|---|---|---|
| Identity | 13 | Users, Organisations, Memberships |
| RBAC | 5 | Roles, User Roles |
| Creator | 18 | Creator Profiles, Services, Packages, Package Reports |
| Commerce | 22 | Store Listings, Subscriptions, Transactions, Invoices, Entitlements, BYOS, Library |
| Deployment | 21 | Deployments, Onboarding, Audiences, Audience Members |
| Survey | 11 | Schedules, Rounds, Invitations, Participant Survey |
| Reporting | 9 | Reports, Report Access, Report Access Log |
| Support | 6 | Tickets, Ticket Messages |
| Chat | 6 | Sessions, Messages |
| Notifications | 5 | Templates, Notification Log |
| Audit | 2 | Audit Events |
| Search | 2 | Unified Search, Suggestions |
| Webhooks | 2 | Stripe, SendGrid |
| Admin — Platform | 12 | Cross-tenant operations |
| Admin — Creator | 6 | Creator management views |
| Admin — Client | 7 | Client admin centre |
| Admin — Service | 8 | Service operator views |
| **Total** | **155** | |

---

## Dependencies

- .NET 8+ with ASP.NET Core
- FluentValidation.AspNetCore
- Microsoft.AspNetCore.Authentication.JwtBearer
- Swashbuckle (OpenAPI/Swagger generation)
- MediatR (optional, for CQRS pattern)

# Database Schema Generator

Reads the SHAPE platform's canonical database design spec (`docs/architecture/04-database-design.md`) and generates production-ready EF Core entities, DbContext, configurations, and PostgreSQL migrations.

---

## Prerequisites

- The **SHAPE project repo** must be open in your workspace (the agent reads the spec doc from the SHAPE repo directly)
- For auto-sync (hook), both the `remediai` and `shape` repos must be in the same multi-root workspace

---

## Quick Start

1. Open your project in any AI editor (Kiro, Copilot, Cursor, Claude Code)
2. Make sure the SHAPE repo is in your workspace
3. Attach `database-schema-generator.agent.md` in chat — **only this one file**
4. Send a short trigger: "Generate the database schema"
5. Agent reads the spec, asks at most 2 questions, then generates everything

---

## What It Generates

| Artefact | Description |
|---|---|
| Raw PostgreSQL SQL | `CREATE TABLE`, `CREATE INDEX`, constraints, FKs — ready to run against Postgres |
| Entity classes | One C# class per table, grouped by entity group (Identity, RBAC, Commerce, etc.) |
| Entity configurations | `IEntityTypeConfiguration<T>` with indexes, constraints, defaults, column mappings |
| DbContext | Full `ShapeDbContext` with DbSets, global query filters, multi-tenancy |
| Migrations | Named EF Core code-first migrations (`Phase5_InitialSchema`) |
| Interfaces | `ITenantScoped`, `IAuditable`, `ISoftDeletable` |
| Enums | Status field enums for application-layer validation |
| Cosmos DB models | Typed model classes for each Cosmos container |
| Cache keys | Redis cache key constants class |

---

## Key Features

- **Spec-driven** — `04-database-design.md` is the single source of truth. Agent never freelances.
- **Delta detection** — On re-run, detects what changed in the spec and generates only incremental migrations.
- **Multi-tenancy** — Automatically applies `organisation_id` global query filters on all tenant-scoped entities.
- **PII awareness** — Marks encrypted columns with `[PersonalData]` and documents encryption requirements.
- **Phase-aware** — Respects deferred tables (post-Phase-5) and generates only in-scope schema.
- **Auto-sync via hook** — A Kiro hook watches `04-database-design.md`; when the file is saved, the agent auto-triggers.

---

## Sync Across Editors

### Kiro (Automatic)

A Kiro hook (`db-spec-sync`) watches `**/04-database-design.md`. When the file is saved, the agent fires automatically — no manual action needed.

**Requirement:** The SHAPE repo must be open in the same workspace.

### VS Code + GitHub Copilot (Manual)

1. Open the workspace with the SHAPE repo
2. In Copilot chat, attach `database-schema-generator.agent.md`
3. Send: `Sync with spec` or `Generate the RBAC Group entities`
4. Copilot reads the latest `04-database-design.md` and generates the output

### Cursor (Manual)

1. Open the workspace with the SHAPE repo
2. In chat, reference `@database-schema-generator.agent.md`
3. Send: `Sync with spec`
4. Cursor reads the latest spec and generates the output

### Claude Code / CLI (Manual)

1. Navigate to the workspace containing the SHAPE repo
2. Reference the agent file: `Read agent-factory/database-schema-generator/database-schema-generator.agent.md and follow its instructions`
3. Send: `Sync with spec`

### CI/CD Auto-Sync (GitHub Actions — Optional Future Enhancement)

For fully automated sync regardless of editor, a GitHub Action can be configured to:
1. Trigger when `04-database-design.md` is modified in a PR/push
2. Run the schema generation
3. Commit the generated code back to the branch

This ensures no one forgets to sync after updating the spec.

---

**Summary:** The agent always reads the latest file from disk. In Kiro it's automatic. In all other editors, you trigger it manually — but it always picks up the freshest version of the doc.

---

## Usage Examples

```text
# Full generation (all Phase 5 tables)
"Generate the database schema"

# Specific group only
"Generate only the Survey group entities"

# After spec update — manual sync
"Sync with spec"

# Cosmos DB models
"Generate typed models for the Cosmos DB containers"

# Raw SQL only
"Generate PostgreSQL DDL for the Commerce group"
```

---

## Spec Update Workflow

When `04-database-design.md` is updated:

1. **Automatic:** Hook fires → agent syncs (if both repos are in workspace)
2. **Manual:** Attach agent in chat → say "Sync with spec" → agent diffs and generates migration

The agent will:
- Detect new tables → generate new entity + configuration + SQL
- Detect new columns → add property + update config + ALTER TABLE migration
- Detect changed constraints/indexes → update configuration
- Flag removals for review (never auto-deletes without confirmation)

---

## Output Structure

```
src/Infrastructure/Persistence/
├── Entities/
│   ├── Identity/          (organisations, users, organisation_memberships)
│   ├── RBAC/              (roles, user_roles)
│   ├── Creator/           (creator_profiles, service_definitions, ...)
│   ├── Commerce/          (subscriptions, transactions, invoices, ...)
│   ├── Deployment/        (deployments, audiences, audience_members, ...)
│   ├── Survey/            (survey_schedules, survey_rounds, ...)
│   ├── Reporting/         (reports, report_access_grants, ...)
│   ├── Support/           (support_tickets, ticket_messages)
│   ├── Chat/              (chat_sessions, chat_messages)
│   ├── Notifications/     (notification_templates, notification_log)
│   └── Audit/             (audit_events)
├── Configurations/        (IEntityTypeConfiguration per entity, same grouping)
├── Interfaces/            (ITenantScoped, IAuditable, ISoftDeletable)
├── Enums/                 (Status enums)
├── Cosmos/                (Typed Cosmos DB models)
├── Cache/                 (Redis cache key constants)
├── Migrations/            (Named EF Core migrations)
└── ShapeDbContext.cs      (DbSets, global filters, model configuration)
```

---

## Dependencies

- .NET 8+ with EF Core 8+
- Npgsql EF Core Provider (PostgreSQL)
- Azure Cosmos DB SDK (for Cosmos models)
- StackExchange.Redis (for cache patterns)

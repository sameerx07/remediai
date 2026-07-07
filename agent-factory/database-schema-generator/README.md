# Database Schema Generator

Generates production-ready PostgreSQL database schemas for any .NET project. Scans existing code to match conventions, reads design docs for table definitions and standards, or uses battle-tested defaults.

**Database:** PostgreSQL only.

---

## Quick Start

1. Open your .NET project in any AI editor (Kiro, Copilot, Cursor, Claude Code)
2. Attach `database-schema-generator.agent.md` in chat — **only this one file**
3. Say: "Create a notifications table" or "Generate from the design doc"
4. Agent scans your project, generates all files matching your conventions

---

## How It Works

| Step | What Happens |
|---|---|
| 1. Find design doc | Looks for `*database-design*` or `*db-schema*` in `docs/` |
| 2. Read conventions | Extracts naming rules, PK strategy, timestamps, etc. from the doc |
| 3. Scan existing code | Detects ORM (EF Core/Dapper), entity patterns, migration style |
| 4. Generate | Creates schema matching doc conventions + project patterns |

---

## Convention Priority

```
1. Design doc conventions (highest — always wins when doc exists)
2. Existing project patterns (match what's already there)
3. Baked-in defaults (fallback when nothing else exists)
```

**Key point:** If the design doc adds a new convention (e.g. "all tables must have a `version` column"), the agent picks it up automatically on next run. The doc is always the source of truth.

---

## What It Generates

| Artefact | Description |
|---|---|
| Raw PostgreSQL SQL | `CREATE TABLE`, `CREATE INDEX`, constraints, FKs — always generated |
| EF Core entities | C# classes with properties mapped to columns (if project uses EF Core) |
| EF Core configurations | `IEntityTypeConfiguration<T>` with indexes, constraints, defaults |
| Migrations | Named EF Core migrations or raw SQL migration files |
| Dapper models | POCOs + SQL migration files (if project uses Dapper) |
| Interfaces | `ITenantScoped`, `IAuditable`, `ISoftDeletable` (if applicable) |

---

## Scenarios & Prompts

### Scenario 1: Existing project + has design doc

```text
"Generate all tables from the design doc"
"Generate the Survey group from the database spec"
"Sync with spec"
```

Agent reads doc for WHAT tables to create and HOW (conventions).

---

### Scenario 2: Existing project + no design doc

```text
"Create a notifications table with title, body, user_id, status, created_at"
"Add a comments table linked to the posts table"
"Add an archived_at column to the orders table"
```

Agent scans existing entities, matches their patterns.

---

### Scenario 3: New project + has design doc

```text
"This is a new project. Generate the full schema from docs/architecture/04-database-design.md"
"Generate all Phase 5 tables from the design doc"
```

Agent reads doc for both conventions AND table definitions.

---

### Scenario 4: New project + no design doc

```text
"Create a users, organisations, and memberships table for a multi-tenant app"
"Scaffold the database for a SaaS platform with auth and billing"
```

Agent uses baked-in PostgreSQL best practices (UUID PKs, snake_case, timestamps, etc.)

---

### Scenario 5: Sync after doc update

```text
"Sync with spec"
"The design doc was updated — generate the new tables"
"What changed in the spec since last generation?"
```

Agent re-reads doc, diffs against existing code, generates only the delta.

---

### Scenario 6: Table not in design doc

```text
"Create a feature_flags table"
```

If doc exists and this table isn't in it:
1. Agent warns: "This table is not in the design doc."
2. Offers to generate it using the doc's conventions with a `-- NOT IN SPEC` marker.

---

## Spec Doc Auto-Sync

**Manual (any editor):**
```text
"Sync with spec"
```

**Automatic (Kiro only):**

A Kiro hook (`db-spec-sync`) watches `**/04-database-design.md`. When the file is saved, the agent fires automatically — no manual trigger needed.

**What happens on sync:**
1. Agent reads the design doc (latest version)
2. Reads both conventions AND table definitions
3. Compares against existing entities/migrations
4. Generates only new/changed tables
5. If conventions changed — applies new rules to generated code
6. Flags removals for review (never auto-deletes)

### Self-Updating Defaults

When the agent detects a new convention in the **SHAPE project's design doc** (`docs/architecture/04-database-design.md`) that isn't in its baked-in defaults:

1. **Auto-adds it** to the agent.md file's defaults section
2. **Logs** what was added: "New convention added: {description}"
3. **All future new projects** (without their own doc) automatically get the updated standard

**Only the SHAPE design doc triggers self-updates.** Other projects' docs are used for generation but don't modify the agent's global defaults.

This means:
- SHAPE's design doc is the single source of truth for team standards
- The agent keeps itself up to date from SHAPE
- No manual maintenance of the agent file needed
- Standards evolve in one place (SHAPE doc) and propagate to all new projects

---

## Default Conventions (When No Doc Exists)

| Convention | Default |
|---|---|
| Primary keys | UUID (`uuid_generate_v4()`) |
| Table naming | snake_case, plural (`users`, `audit_events`) |
| Column naming | snake_case (`created_at`, `user_id`) |
| Foreign keys | `{entity_singular}_id` with explicit constraints |
| Timestamps | `created_at` + `updated_at` TIMESTAMPTZ DEFAULT NOW() |
| Soft deletes | `deleted_at TIMESTAMPTZ` where applicable |
| Status fields | `VARCHAR(50)` with documented allowed values |
| Tenant scope | `organisation_id UUID NOT NULL` on scoped tables |
| JSON fields | `JSONB` (not JSON) |
| Indexes | Named `idx_{table}_{columns}`, on all FKs |
| Extensions | `uuid-ossp` for UUID generation |

---

## Adapts To

- **EF Core** → entities, configurations, Fluent API, code-first migrations
- **Dapper** → POCOs, raw SQL migrations, repository pattern
- **Both** → generates both layers
- **Any folder structure** — flat or grouped by domain
- **Any naming** — matches existing entity/property naming

---

## Quality Standards (Always Enforced)

- FK integrity — every FK has an explicit constraint
- Index all FKs — no unindexed foreign keys
- Named constraints — `uq_`, `idx_`, `chk_` prefixes
- Topological order — creates tables in dependency order
- UTC timestamps — always `TIMESTAMPTZ`, never without timezone
- Explicit NULL/NOT NULL on every column
- Never DROP without user confirmation
- Idempotent SQL — `IF NOT EXISTS` in raw migrations

---

## Works With

- .NET 6, 7, 8+
- PostgreSQL 14, 15, 16+
- EF Core (Npgsql provider)
- Dapper
- Any migration tool (EF Core migrations, DbUp, FluentMigrator, raw SQL)

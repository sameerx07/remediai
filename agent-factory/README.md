# Agent Factory

Reusable AI agents. Drop into any project, attach in chat, get results.

---

## Available Agents

| Agent | Purpose | Entrypoint |
|---|---|---|
| **docs-site-builder** | Generates a Stripe-style documentation site from any folder of Markdown files. Next.js 15, Tailwind, clean design. | [`docs-site-builder/docs-site-builder.agent.md`](./docs-site-builder/docs-site-builder.agent.md) |
| **codebase-docs** | Reads code files and generates documentation markdown from them. | [`codebase-docs/codebase-docs.agent.md`](./codebase-docs/codebase-docs.agent.md) |
| **azure-pipeline-creator** | Generates production-grade Azure DevOps pipelines. Docker build+push, Terraform plan/apply, Helm deploy, QA automation, GitOps image-tag pinning. | [`azure-pipeline-creator/azure-pipeline-creator.agent.md`](./azure-pipeline-creator/azure-pipeline-creator.agent.md) |
| **database-schema-generator** | Reads a canonical database design spec and generates EF Core entities, DbContext, configurations, and code-first migrations. Re-reads spec on every run to stay in sync. | [`database-schema-generator/database-schema-generator.agent.md`](./database-schema-generator/database-schema-generator.agent.md) |
| **api-endpoint-creator** | Generates production-ready ASP.NET Core API endpoints for any .NET project. Scans existing code to match conventions or uses battle-tested defaults. Controllers, DTOs, validators, services. | [`api-endpoint-creator/api-endpoint-creator.agent.md`](./api-endpoint-creator/api-endpoint-creator.agent.md) |

---

## How to Use

1. Open your project in any AI editor (Kiro, Copilot, Cursor, Claude Code)
2. Attach the `.agent.md` file in chat — **only this one file**
3. Send a short trigger: "Build a docs site from ./docs"
4. Agent asks ONE question (project name), then builds everything
5. Preview with `npm run dev`

---

## Adding a New Agent

1. Create folder: `agent-factory/<agent-name>/`
2. Add `<agent-name>.agent.md` (instructions file)
3. Add `README.md` (quick start for humans)
4. Update the table above

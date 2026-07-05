# Codebase Docs — Full-Project Documentation Intelligence

**One agent. Entire project. Complete documentation.**

Codebase Docs is an autonomous documentation agent that reads your entire project source code — every language, every framework, every layer — and produces comprehensive, cross-referenced, publication-ready documentation that a new engineer can use to fully understand and contribute to the project from day one.

This is not a docstring extractor. This is a full-stack project intelligence engine.

---

## What Makes It Different

| Feature | Typical Doc Tools | Codebase Docs |
|---|---|---|
| **Input** | One language at a time | Entire polyglot project at once |
| **Scope** | API reference only | Architecture + APIs + Components + Types + Infra + Security + Data + Workflows + Config + Testing |
| **Output** | Raw API signatures | Narrative documentation with context, diagrams, examples, and cross-references |
| **Intelligence** | Pattern matching | Understands business logic, data flow, auth chains, event systems |
| **Diagrams** | None | Mermaid architecture, ER, sequence, and dependency diagrams |
| **Audience** | Developers reading API docs | New engineers onboarding, API consumers, architects, DevOps |

---

## Supported Languages and Frameworks

### Full Support (Deep Extraction)

| Language | Frameworks |
|---|---|
| **TypeScript / JavaScript** | Next.js, React, Vue, Angular, Express, Fastify, NestJS, Hono, tRPC, Remix |
| **Python** | FastAPI, Flask, Django, Celery, SQLAlchemy, Pydantic, Click |
| **Go** | Gin, Echo, Chi, gRPC, GORM, Cobra |
| **Rust** | Actix-web, Axum, Rocket, Diesel, SeaORM, Clap |
| **Java / Kotlin** | Spring Boot, Quarkus, Micronaut, Ktor, JPA/Hibernate |
| **C# / .NET** | ASP.NET Core, Entity Framework, Minimal APIs, MediatR |
| **Ruby** | Rails, Sinatra, Grape, ActiveRecord |
| **PHP** | Laravel, Symfony, Doctrine |
| **Swift** | Vapor, SwiftUI |
| **Dart** | Flutter, Shelf |
| **HCL** | Terraform, OpenTofu, Pulumi |

### Infrastructure and Config

| Category | Sources |
|---|---|
| **IaC** | Terraform, Pulumi, CloudFormation, Bicep, CDK |
| **Containers** | Dockerfile, docker-compose, Kubernetes manifests, Helm charts |
| **CI/CD** | GitHub Actions, GitLab CI, Azure Pipelines, Jenkins, CircleCI |
| **API Specs** | OpenAPI 3.x, Swagger 2.x, GraphQL SDL, gRPC proto files, AsyncAPI |
| **Database** | Prisma, Drizzle, TypeORM, SQLAlchemy, Alembic, Django ORM, ActiveRecord, EF Core, GORM, Diesel |
| **Message Queues** | Bull/BullMQ, Celery, RabbitMQ configs, Kafka topics, SQS/SNS |
| **Config** | .env, YAML configs, TOML, JSON schemas, feature flags |

---

## What It Produces

```
project-docs/
├── README.md                           ← Master index + quick navigation
│
├── 01-overview/
│   ├── architecture.md                 ← System architecture with Mermaid diagram
│   ├── tech-stack.md                   ← Complete technology inventory
│   ├── project-structure.md            ← Directory map with purpose of each folder
│   └── glossary.md                     ← Domain terms and abbreviations
│
├── 02-getting-started/
│   ├── prerequisites.md                ← System requirements, tool versions
│   ├── installation.md                 ← Step-by-step local setup
│   ├── development-workflow.md         ← How to run, test, build, deploy locally
│   └── first-contribution.md           ← Where to start, PR guidelines
│
├── 03-architecture/
│   ├── system-design.md                ← High-level architecture decisions
│   ├── data-flow.md                    ← How data moves through the system (with diagrams)
│   ├── authentication.md               ← Auth architecture, flows, token lifecycle
│   ├── event-system.md                 ← Events, queues, async workflows
│   ├── error-handling.md               ← Error strategy, error codes, retry policies
│   └── dependency-graph.md             ← Package/service dependency Mermaid diagram
│
├── 04-api-reference/
│   ├── _overview.md                    ← Base URLs, versioning, auth, pagination, errors
│   ├── {domain}.md                     ← One file per resource domain
│   └── webhooks.md                     ← Webhook events, payloads, retry policy
│
├── 05-components/
│   ├── _overview.md                    ← Design system, patterns, conventions
│   └── {ComponentName}.md              ← Props, usage, variants, accessibility
│
├── 06-data-layer/
│   ├── schema.md                       ← ER diagram + all models
│   ├── migrations.md                   ← Migration history and strategy
│   ├── queries.md                      ← Key query patterns and optimizations
│   └── caching.md                      ← Cache strategy, invalidation, TTLs
│
├── 07-types/
│   ├── models.md                       ← Core domain types
│   ├── api-contracts.md                ← Request/response types
│   ├── events.md                       ← Event payload types
│   └── enums.md                        ← All enums and constants
│
├── 08-infrastructure/
│   ├── cloud-architecture.md           ← Cloud resource map with diagram
│   ├── modules.md                      ← IaC module reference (inputs/outputs)
│   ├── networking.md                   ← Network topology, security groups
│   ├── environments.md                 ← Dev vs staging vs prod comparison
│   └── cost.md                         ← Cost breakdown if available
│
├── 09-security/
│   ├── authentication.md               ← Auth implementation details
│   ├── authorization.md                ← RBAC/ABAC model, permission matrix
│   ├── secrets-management.md           ← How secrets are stored and rotated
│   ├── network-security.md             ← Firewall rules, private endpoints, TLS
│   └── compliance.md                   ← Security controls, audit logging
│
├── 10-operations/
│   ├── deployment.md                   ← Deploy process, environments, rollback
│   ├── monitoring.md                   ← Metrics, alerts, dashboards, logging
│   ├── troubleshooting.md              ← Common issues and fixes
│   ├── runbooks.md                     ← Operational procedures
│   └── ci-cd.md                        ← Pipeline documentation
│
├── 11-testing/
│   ├── strategy.md                     ← Testing philosophy, coverage targets
│   ├── unit-tests.md                   ← How to write and run unit tests
│   ├── integration-tests.md            ← Integration test patterns
│   ├── e2e-tests.md                    ← E2E test setup and patterns
│   └── test-utilities.md               ← Shared test helpers, fixtures, mocks
│
├── 12-config/
│   ├── environment-variables.md        ← Complete env var reference
│   ├── feature-flags.md                ← Feature flag reference
│   └── service-config.md              ← Service-specific configuration
│
└── 13-sdk/
    ├── typescript.md                   ← TypeScript client usage
    ├── python.md                       ← Python client usage
    └── curl.md                         ← Raw HTTP examples for every endpoint
```

---

## Example Prompts

```
Document this entire project. Scan everything.
```

```
Someone gave me this codebase — generate full documentation so I can understand it.
```

```
Scan ./src and ./infra, generate docs for onboarding a new developer.
```

```
I need complete API documentation with curl examples for every endpoint.
```

---

## Usage

1. Attach **`codebase-docs.agent.md`** in your AI chat (Kiro, Copilot, Cursor, Claude).
2. Tell it to scan the project (or specific paths).
3. Answer 1-3 quick questions (project name, scope).
4. Agent scans everything, generates all documentation.
5. Optionally chain into **`docs-site-builder`** for a live site.

---

## Philosophy

- **Entire project, not one file.** Understands the system as a whole.
- **Narrative, not just signatures.** Explains why things exist, not just what they are.
- **Diagrams first.** Architecture diagrams, ER diagrams, sequence diagrams — visuals for complex systems.
- **Cross-referenced.** Every doc links to related docs. No orphan pages.
- **New-engineer ready.** Someone with zero context can onboard from these docs alone.
- **Framework-aware.** Understands conventions of 40+ frameworks across 10+ languages.
- **Security-conscious.** Never includes actual secrets, connection strings, or sensitive values in output.

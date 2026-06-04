# Phase 3 - PostgreSQL Schema and Alembic Migrations

## Goal

Define and enforce the canonical persistence layer for RemediAI using SQLAlchemy 2.0 async ORM models and Alembic migrations.

This phase establishes:
- ORM base and async session factory
- canonical ORM model mappings
- migration-managed PostgreSQL schema evolution
- indexed access patterns for incident processing, auditability, and target registry selection

## Deliverables

### 1) Data access package structure

The data access package structure is:

```text
packages/data_access/
├── __init__.py
├── base.py
├── session.py
└── models/
    ├── __init__.py
    ├── incident_orm.py
    ├── analysis_orm.py
    ├── audit_log_orm.py
    └── monitor_target_orm.py
```

### 2) ORM base and session contract

File: packages/data_access/base.py
- Define Base as SQLAlchemy DeclarativeBase.

File: packages/data_access/session.py
- Provide build_session_factory() -> async_sessionmaker[AsyncSession].
- Create module-level async_session_factory singleton.
- Provide get_db_session() async generator that:
  - yields AsyncSession
  - commits on success
  - rolls back on exception

Settings contract:
- Session factory reads database_url from shared settings provider in packages/config.

### 3) Incident ORM contract

File: packages/data_access/models/incident_orm.py

Model: IncidentOrm
- __tablename__ = incidents
- Unique index: ix_incidents_fingerprint on fingerprint

Columns:
- id: UUID primary key
- correlation_id: UUID not null
- source: String(255) not null
- exception_type: String(500) not null
- exception_message: Text not null
- stack_trace: Text nullable
- fingerprint: String(64) not null
- priority: String(20) default medium
- status: String(30) default new
- raw_payload: JSONB default empty dict
- created_at: DateTime(timezone=True) not null
- updated_at: DateTime(timezone=True) not null
- exception_language: String(20) nullable
- approval_status: String(20) nullable
- approved_by: String(255) nullable
- approved_at: DateTime(timezone=True) nullable
- approved_recommendation_rank: Integer nullable
- monitoring_result: JSONB nullable
- pr_url: Text nullable
- pr_branch: String(255) nullable

Relationships:
- analyses: one-to-many to AnalysisOrm with delete-orphan cascade
- audit_logs: one-to-many to AuditLogOrm

### 4) Analysis ORM contract

File: packages/data_access/models/analysis_orm.py

Model: AnalysisOrm
- __tablename__ = incident_analyses
- Index: ix_incident_analyses_incident_id on incident_id

Columns:
- id: UUID primary key
- incident_id: UUID foreign key to incidents.id on delete cascade
- root_cause: Text nullable
- root_cause_json: JSONB nullable
- recommendations: JSONB default empty list
- code_snippets: JSONB default empty list
- rag_results: JSONB default empty list
- agent_trace: JSONB default empty list
- created_at: DateTime(timezone=True) not null

Relationships:
- incident: many-to-one to IncidentOrm

### 5) Audit log ORM contract

File: packages/data_access/models/audit_log_orm.py

Model: AuditLogOrm
- __tablename__ = audit_log
- Indexes:
  - ix_audit_log_incident_id on incident_id
  - ix_audit_log_timestamp on timestamp

Columns:
- id: UUID primary key
- incident_id: UUID nullable foreign key to incidents.id on delete set null
- agent_name: String(100) not null
- action: String(255) not null
- actor_identity: String(255) nullable
- metadata: JSONB column mapped via Python attribute log_metadata with default empty dict
- timestamp: DateTime(timezone=True) not null

Relationships:
- incident: many-to-one to IncidentOrm

### 6) Monitor target ORM contract

File: packages/data_access/models/monitor_target_orm.py

Model: MonitorTargetOrm
- __tablename__ = monitor_targets
- Unique index: ix_monitor_targets_env_type_key on (environment, target_type, target_key)

Columns:
- id: UUID primary key
- environment: String(32) not null
- target_type: String(32) not null
- target_key: String(255) not null
- display_name: String(255) not null
- enabled: Boolean default false
- metadata: JSONB column mapped via Python attribute metadata_json with default empty dict
- created_at: DateTime(timezone=True) not null
- updated_at: DateTime(timezone=True) not null

### 7) Public export contract

File: packages/data_access/models/__init__.py exports:
- AnalysisOrm
- AuditLogOrm
- IncidentOrm
- MonitorTargetOrm

File: packages/data_access/__init__.py exports:
- Base
- AnalysisOrm
- AuditLogOrm
- IncidentOrm
- async_session_factory
- build_session_factory
- get_db_session

### 8) Alembic migration contract

Migration chain:
- alembic/versions/0001_initial_schema.py
- alembic/versions/0002_approval_columns.py
- alembic/versions/0003_monitor_targets.py
- alembic/versions/0004_monitoring_result.py
- alembic/versions/0005_exception_language.py
- alembic/versions/0006_remove_work_items_add_pr_fields.py

Canonical final schema includes tables:
- incidents
- incident_analyses
- audit_log
- monitor_targets

Schema evolution contract:
- work_items table is removed by migration 0006.
- PR tracking fields are stored on incidents via pr_url and pr_branch.

## Security Touchpoints

- ORM and migration layers do not contain hardcoded secrets.
- Database connectivity is configuration-driven via settings.
- Audit table keeps actor_identity and action fields for traceability.
- Incident approval and monitoring columns are persisted for governance controls.
- JSONB columns store structured agent outputs while preserving schema evolution flexibility.

## Acceptance Criteria

- python -c "from packages.data_access import Base, IncidentOrm, AnalysisOrm, AuditLogOrm; print('OK')" prints OK.
- python -c "from packages.data_access.models import MonitorTargetOrm; print('OK')" prints OK.
- pytest tests/unit/test_data_access_models.py -v executes successfully.
- ruff check packages/data_access/ alembic/ exits 0.
- mypy packages/data_access/ --strict exits 0.
- alembic revision chain resolves through 0006 without gaps.

## Out of Scope

- Service-level business logic on top of ORM repositories.
- Cross-database portability beyond PostgreSQL dialect contracts.
- Query performance tuning beyond declared schema indexes.
- External queue or broker persistence patterns outside PostgreSQL-backed workflow.

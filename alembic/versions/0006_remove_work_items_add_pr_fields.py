"""Remove work_items table; add pr_url and pr_branch to incidents.

ADO Boards bug creation has been removed. PR tracking moves directly
onto the incidents table.

Revision ID: 0006
Revises: 0005
"""

from __future__ import annotations

import sqlalchemy as sa

from alembic import op

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("incidents", sa.Column("pr_url", sa.Text, nullable=True))
    op.add_column("incidents", sa.Column("pr_branch", sa.String(255), nullable=True))
    op.drop_table("work_items")


def downgrade() -> None:
    op.create_table(
        "work_items",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("incident_id", sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("item_type", sa.String(50), nullable=False),
        sa.Column("ado_item_id", sa.Integer, nullable=True),
        sa.Column("ado_item_url", sa.Text, nullable=True),
        sa.Column("pr_url", sa.Text, nullable=True),
        sa.Column("pr_branch", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.drop_column("incidents", "pr_branch")
    op.drop_column("incidents", "pr_url")

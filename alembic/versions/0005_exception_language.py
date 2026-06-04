"""Add exception_language column to incidents (Phase 36).

Revision ID: 0005
Revises: 0004
"""

from __future__ import annotations

import sqlalchemy as sa

from alembic import op

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "incidents",
        sa.Column("exception_language", sa.String(20), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("incidents", "exception_language")

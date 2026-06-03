"""Add monitoring_result column to incidents (Phase 37).

Revision ID: 0004
Revises: 0003
"""

from __future__ import annotations

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "incidents",
        sa.Column("monitoring_result", JSONB, nullable=True),
    )


def downgrade() -> None:
    op.drop_column("incidents", "monitoring_result")

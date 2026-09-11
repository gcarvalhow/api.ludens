"""catalog admin: tabelas shows e sessions

Revision ID: 0002_catalog_admin
Revises: 0001_identity_auth
Create Date: 2026-09-10
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002_catalog_admin"
down_revision: Union[str, None] = "0001_identity_auth"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Enums nao-nativos (VARCHAR + CHECK): mesmos valores que o aggregate persiste
# (values_callable no SAEnum de Show/Session).
_SHOW_STATUS = sa.Enum("draft", "published", name="show_status", native_enum=False, length=20)
_SESSION_STATUS = sa.Enum(
    "on_sale", "cancelled", name="session_status", native_enum=False, length=20
)


def _model_columns() -> list[sa.Column]:
    # Colunas herdadas de core Model, iguais em toda tabela (defaults no ORM).
    return [
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
    ]


def upgrade() -> None:
    op.create_table(
        "shows",
        *_model_columns(),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("synopsis", sa.String(length=5000), nullable=False),
        sa.Column("image_url", sa.String(length=2048), nullable=False),
        sa.Column("genre", sa.String(length=80), nullable=False),
        sa.Column("status", _SHOW_STATUS, nullable=False),
    )
    op.create_table(
        "sessions",
        *_model_columns(),
        sa.Column(
            "show_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("shows.id"),
            nullable=False,
        ),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("venue", sa.String(length=200), nullable=False),
        sa.Column("capacity", sa.Integer(), nullable=False),
        sa.Column("full_price_cents", sa.Integer(), nullable=False),
        sa.Column("status", _SESSION_STATUS, nullable=False),
    )
    op.create_index("ix_sessions_show_id", "sessions", ["show_id"])
    op.create_index("ix_sessions_starts_at_status", "sessions", ["starts_at", "status"])


def downgrade() -> None:
    op.drop_index("ix_sessions_starts_at_status", table_name="sessions")
    op.drop_index("ix_sessions_show_id", table_name="sessions")
    op.drop_table("sessions")
    op.drop_table("shows")

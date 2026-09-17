"""identity user lifecycle: account_deletion_tokens, email_change_tokens

Revision ID: 0003_identity_user_lifecycle
Revises: 0002_catalog_admin
Create Date: 2026-09-17
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0003_identity_user_lifecycle"
down_revision: Union[str, None] = "0002_catalog_admin"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def _model_columns() -> list[sa.Column]:
    # Columns inherited from core Model, the same in every table.
    return [
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
    ]

def upgrade() -> None:
    op.create_table(
        "account_deletion_tokens",
        *_model_columns(),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_account_deletion_tokens_user_id", "account_deletion_tokens", ["user_id"])
    op.create_index("ix_account_deletion_tokens_token_hash", "account_deletion_tokens", ["token_hash"])

    op.create_table(
        "email_change_tokens",
        *_model_columns(),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("new_email", sa.String(length=254), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_email_change_tokens_user_id", "email_change_tokens", ["user_id"])
    op.create_index("ix_email_change_tokens_token_hash", "email_change_tokens", ["token_hash"])

def downgrade() -> None:
    op.drop_table("email_change_tokens")
    op.drop_table("account_deletion_tokens")

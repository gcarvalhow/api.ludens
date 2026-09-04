"""identity-auth: events (outbox) + buyers, refresh_tokens, password_reset_tokens

Revision ID: 0001_identity_auth
Revises:
Create Date: 2026-09-04

Primeira migration do repo. Alem das tabelas do modulo identity, cria a tabela
`events` do outbox (core), que passa a existir com a primeira feature — o
env.py ja mapeia app.outbox.models no metadata. Os indices unicos parciais
(email/cpf onde is_active) sao escritos a mao: o autogenerate do Alembic nao os
gera corretamente.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001_identity_auth"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

buyer_role = postgresql.ENUM("buyer", "admin", name="buyer_role", create_type=False)


def _model_columns() -> list[sa.Column]:
    # Colunas herdadas de core Model, iguais em toda tabela.
    return [
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
    ]


def upgrade() -> None:
    op.create_table(
        "events",
        *_model_columns(),
        sa.Column("aggregate_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("event_type", sa.String(length=128), nullable=False),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("dispatched_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_events_aggregate_id", "events", ["aggregate_id"])
    op.create_index("ix_events_event_type", "events", ["event_type"])

    buyer_role.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "buyers",
        *_model_columns(),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("cpf", sa.String(length=11), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("password_hash", sa.String(length=60), nullable=False),
        sa.Column("role", buyer_role, nullable=False),
        sa.Column("security_stamp", postgresql.UUID(as_uuid=True), nullable=False),
    )
    # Unicidade de e-mail e CPF apenas entre contas ativas (soft delete).
    op.create_index(
        "uq_buyers_email_active",
        "buyers",
        ["email"],
        unique=True,
        postgresql_where=sa.text("is_active"),
    )
    op.create_index(
        "uq_buyers_cpf_active",
        "buyers",
        ["cpf"],
        unique=True,
        postgresql_where=sa.text("is_active"),
    )

    op.create_table(
        "refresh_tokens",
        *_model_columns(),
        sa.Column("buyer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used", sa.Boolean(), nullable=False),
        sa.Column("rotated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_refresh_tokens_buyer_id", "refresh_tokens", ["buyer_id"])
    op.create_index("ix_refresh_tokens_token_hash", "refresh_tokens", ["token_hash"])

    op.create_table(
        "password_reset_tokens",
        *_model_columns(),
        sa.Column("buyer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_password_reset_tokens_buyer_id", "password_reset_tokens", ["buyer_id"])
    op.create_index("ix_password_reset_tokens_token_hash", "password_reset_tokens", ["token_hash"])


def downgrade() -> None:
    op.drop_table("password_reset_tokens")
    op.drop_table("refresh_tokens")
    op.drop_table("buyers")
    buyer_role.drop(op.get_bind(), checkfirst=True)
    op.drop_table("events")

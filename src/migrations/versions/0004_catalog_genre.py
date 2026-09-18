"""catalog genre: genres table, shows.genre_id FK, backfill and drop shows.genre

Revision ID: 0004_catalog_genre
Revises: 0003_identity_user_lifecycle
Create Date: 2026-09-18

Genre was a free-text column on `shows` (`genre`, String(80)) with no entity
behind it. This migration promotes it to its own aggregate (`genres` table)
and replaces `shows.genre` with a mandatory `shows.genre_id` FK, backfilling
one `genres` row per distinct existing `shows.genre` value (exact-string
dedup, written by hand — autogenerate does not produce backfill logic).
"""

import uuid
from datetime import datetime, timezone
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0004_catalog_genre"
down_revision: Union[str, None] = "0003_identity_user_lifecycle"
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
        "genres",
        *_model_columns(),
        sa.Column("name", sa.String(length=80), nullable=False),
    )
    # Uniqueness only among active genres — same pattern as
    # uq_users_email_active/uq_users_cpf_active (0001_identity_auth).
    op.create_index(
        "uq_genres_name_active",
        "genres",
        ["name"],
        unique=True,
        postgresql_where=sa.text("is_active"),
    )

    op.add_column("shows", sa.Column("genre_id", postgresql.UUID(as_uuid=True), nullable=True))

    genres_t = sa.table(
        "genres",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("updated_at", sa.DateTime(timezone=True)),
        sa.column("is_active", sa.Boolean()),
        sa.column("name", sa.String()),
    )
    shows_t = sa.table(
        "shows",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("genre", sa.String()),
        sa.column("genre_id", postgresql.UUID(as_uuid=True)),
    )

    connection = op.get_bind()
    now = datetime.now(timezone.utc)

    distinct_genres = connection.execute(sa.select(shows_t.c.genre).distinct()).scalars().all()

    for genre_name in distinct_genres:
        genre_id = uuid.uuid4()
        connection.execute(
            genres_t.insert().values(
                id=genre_id, created_at=now, updated_at=now, is_active=True, name=genre_name,
            )
        )
        connection.execute(
            sa.update(shows_t).where(shows_t.c.genre == genre_name).values(genre_id=genre_id)
        )

    op.drop_column("shows", "genre")
    op.alter_column("shows", "genre_id", nullable=False)
    op.create_foreign_key("fk_shows_genre_id_genres", "shows", "genres", ["genre_id"], ["id"])
    op.create_index("ix_shows_genre_id", "shows", ["genre_id"])


def downgrade() -> None:
    op.drop_index("ix_shows_genre_id", table_name="shows")
    op.drop_constraint("fk_shows_genre_id_genres", "shows", type_="foreignkey")
    op.add_column("shows", sa.Column("genre", sa.String(length=80), nullable=True))

    connection = op.get_bind()
    shows_t = sa.table(
        "shows",
        sa.column("genre_id", postgresql.UUID(as_uuid=True)),
        sa.column("genre", sa.String()),
    )
    genres_t = sa.table(
        "genres", sa.column("id", postgresql.UUID(as_uuid=True)), sa.column("name", sa.String())
    )

    for genre_id, name in connection.execute(sa.select(genres_t.c.id, genres_t.c.name)).all():
        connection.execute(sa.update(shows_t).where(shows_t.c.genre_id == genre_id).values(genre=name))

    op.alter_column("shows", "genre", nullable=False)
    op.drop_column("shows", "genre_id")
    op.drop_index("uq_genres_name_active", table_name="genres")
    op.drop_table("genres")

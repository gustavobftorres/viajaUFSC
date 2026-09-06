"""Initial SINTER persistence tables.

Revision ID: 20260906_0001
Revises:
Create Date: 2026-09-06 00:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260906_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "opportunities",
        sa.Column("external_id", sa.String(length=512), nullable=False),
        sa.Column("source_url", sa.Text(), nullable=False),
        sa.Column("canonical_url", sa.Text(), nullable=True),
        sa.Column("content_hash", sa.String(length=64), nullable=False),
        sa.Column("first_seen_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("kind", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=100), nullable=True),
        sa.Column("program", sa.Text(), nullable=True),
        sa.Column("link_text", sa.Text(), nullable=True),
        sa.Column("audience", sa.Text(), nullable=True),
        sa.Column("application_deadline", sa.String(length=255), nullable=True),
        sa.Column("deadline_text", sa.Text(), nullable=True),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("published_at", sa.String(length=255), nullable=True),
        sa.Column("modified_at", sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint("external_id"),
    )
    op.create_index("ix_opportunities_status", "opportunities", ["status"])
    op.create_index("ix_opportunities_deadline", "opportunities", ["application_deadline"])
    op.create_table(
        "institutions",
        sa.Column("external_id", sa.String(length=512), nullable=False),
        sa.Column("source_url", sa.Text(), nullable=False),
        sa.Column("canonical_url", sa.Text(), nullable=True),
        sa.Column("content_hash", sa.String(length=64), nullable=False),
        sa.Column("first_seen_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("continent", sa.String(length=100), nullable=False),
        sa.Column("country", sa.String(length=255), nullable=True),
        sa.Column("details", sa.Text(), nullable=True),
        sa.Column("start_date", sa.String(length=255), nullable=True),
        sa.Column("end_date", sa.String(length=255), nullable=True),
        sa.Column("agreement_type", sa.String(length=255), nullable=True),
        sa.Column("subject_area", sa.Text(), nullable=True),
        sa.Column("exchange_available", sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint("external_id"),
    )
    op.create_index("ix_institutions_continent", "institutions", ["continent"])
    op.create_index("ix_institutions_country", "institutions", ["country"])
    op.create_index("ix_institutions_subject_area", "institutions", ["subject_area"])
    op.create_index("ix_institutions_exchange_available", "institutions", ["exchange_available"])


def downgrade() -> None:
    op.drop_table("institutions")
    op.drop_table("opportunities")

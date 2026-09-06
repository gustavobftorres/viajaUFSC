"""Modelos relacionais dos dados normalizados coletados da SINTER."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Index, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Base declarativa usada pelo Alembic e pelos repositórios."""


class SinterRecordMixin:
    """Campos de proveniência e sincronização comuns aos registros SINTER."""

    external_id: Mapped[str] = mapped_column(String(512), primary_key=True)
    source_url: Mapped[str] = mapped_column(Text)
    canonical_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    first_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class Opportunity(SinterRecordMixin, Base):
    """Edital ou oportunidade derivada de um ``Notice`` normalizado."""

    __tablename__ = "opportunities"
    __table_args__ = (
        Index("ix_opportunities_status", "status"),
        Index("ix_opportunities_deadline", "application_deadline"),
    )

    title: Mapped[str] = mapped_column(Text)
    kind: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str | None] = mapped_column(String(100), nullable=True)
    program: Mapped[str | None] = mapped_column(Text, nullable=True)
    link_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    audience: Mapped[str | None] = mapped_column(Text, nullable=True)
    application_deadline: Mapped[str | None] = mapped_column(String(255), nullable=True)
    deadline_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    published_at: Mapped[str | None] = mapped_column(String(255), nullable=True)
    modified_at: Mapped[str | None] = mapped_column(String(255), nullable=True)


class Institution(SinterRecordMixin, Base):
    """Instituição/parceria derivada de um ``Agreement`` normalizado."""

    __tablename__ = "institutions"
    __table_args__ = (
        Index("ix_institutions_continent", "continent"),
        Index("ix_institutions_country", "country"),
        Index("ix_institutions_subject_area", "subject_area"),
        Index("ix_institutions_exchange_available", "exchange_available"),
    )

    name: Mapped[str] = mapped_column(Text)
    continent: Mapped[str] = mapped_column(String(100))
    country: Mapped[str | None] = mapped_column(String(255), nullable=True)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_date: Mapped[str | None] = mapped_column(String(255), nullable=True)
    end_date: Mapped[str | None] = mapped_column(String(255), nullable=True)
    agreement_type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    subject_area: Mapped[str | None] = mapped_column(Text, nullable=True)
    # A fonte atual não publica esse atributo de forma estruturada; ``None``
    # preserva essa ausência até que o coletor passe a fornecê-lo.
    exchange_available: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

"""Contratos públicos da API de consulta."""

from __future__ import annotations

from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field


class OpportunityResponse(BaseModel):
    """Edital ou oportunidade publicada pela SINTER."""

    model_config = ConfigDict(from_attributes=True)

    external_id: str
    title: str
    kind: str | None = None
    status: str | None = None
    program: str | None = None
    link_text: str | None = None
    audience: str | None = None
    application_deadline: str | None = None
    deadline_text: str | None = None
    body: str | None = None
    published_at: str | None = None
    modified_at: str | None = None
    source_url: str
    canonical_url: str | None = None
    first_seen_at: datetime
    updated_at: datetime


class InstitutionResponse(BaseModel):
    """Instituição estrangeira com acordo registrado pela SINTER."""

    model_config = ConfigDict(from_attributes=True)

    external_id: str
    name: str
    continent: str
    country: str | None = None
    details: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    agreement_type: str | None = None
    subject_area: str | None = None
    exchange_available: bool | None = None
    source_url: str
    canonical_url: str | None = None
    first_seen_at: datetime
    updated_at: datetime


ItemT = TypeVar("ItemT")


class Page(BaseModel, Generic[ItemT]):
    """Envelope comum das coleções, incluindo metadados de paginação."""

    items: list[ItemT]
    page: int = Field(ge=1)
    page_size: int = Field(ge=1)
    total: int = Field(ge=0)

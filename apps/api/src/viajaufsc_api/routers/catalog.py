"""Rotas de leitura do catálogo público SINTER."""

from __future__ import annotations

from collections.abc import AsyncIterator
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from viajaufsc_api.db.database import Database
from viajaufsc_api.db.repositories import CatalogRepository
from viajaufsc_api.errors import CATALOG_ERROR_RESPONSES
from viajaufsc_api.schemas import InstitutionResponse, OpportunityResponse, Page

router = APIRouter(tags=["Catálogo"])


async def get_session(request: Request) -> AsyncIterator[AsyncSession]:
    """Obtém uma sessão apenas quando a API recebeu uma configuração de banco."""
    database: Database | None = getattr(request.app.state, "database", None)
    if database is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not configured.",
        )
    async with database.session() as session:
        yield session


SessionDependency = Annotated[AsyncSession, Depends(get_session)]
PageNumber = Annotated[int, Query(ge=1, description="Página, iniciando em 1.")]
PageSize = Annotated[int, Query(ge=1, le=100, description="Itens por página (máximo 100).")]


@router.get(
    "/opportunities",
    response_model=Page[OpportunityResponse],
    responses=CATALOG_ERROR_RESPONSES,
    summary="Lista editais e oportunidades",
)
async def list_opportunities(
    session: SessionDependency,
    page: PageNumber = 1,
    page_size: PageSize = 20,
    status_filter: Annotated[str | None, Query(alias="status", description="Status exato, sem diferenciar maiúsculas/minúsculas.")] = None,
    deadline_from: Annotated[date | None, Query(description="Prazo a partir de, em YYYY-MM-DD.")] = None,
    deadline_to: Annotated[date | None, Query(description="Prazo até, em YYYY-MM-DD.")] = None,
) -> Page[OpportunityResponse]:
    """Retorna oportunidades com filtros opcionais de status e prazo."""
    result = await CatalogRepository(session).list_opportunities(
        page=page, page_size=page_size, status=status_filter,
        deadline_from=deadline_from.isoformat() if deadline_from else None,
        deadline_to=deadline_to.isoformat() if deadline_to else None,
    )
    return Page[OpportunityResponse](items=result.items, page=page, page_size=page_size, total=result.total)


@router.get(
    "/opportunities/{external_id}",
    response_model=OpportunityResponse,
    responses=CATALOG_ERROR_RESPONSES,
    summary="Busca uma oportunidade pelo identificador da fonte",
)
async def get_opportunity(external_id: str, session: SessionDependency) -> OpportunityResponse:
    opportunity = await CatalogRepository(session).get_opportunity(external_id)
    if opportunity is None:
        raise HTTPException(status_code=404, detail="Opportunity not found.")
    return opportunity


@router.get(
    "/institutions",
    response_model=Page[InstitutionResponse],
    responses=CATALOG_ERROR_RESPONSES,
    summary="Lista instituições parceiras",
)
async def list_institutions(
    session: SessionDependency,
    page: PageNumber = 1,
    page_size: PageSize = 20,
    continent: Annotated[str | None, Query(description="Continente exato, sem diferenciar maiúsculas/minúsculas.")] = None,
    country: Annotated[str | None, Query(description="País exato, sem diferenciar maiúsculas/minúsculas.")] = None,
    subject_area: Annotated[str | None, Query(description="Trecho da área de conhecimento.")] = None,
    exchange_available: Annotated[bool | None, Query(description="Filtra pela disponibilidade de intercâmbio.")] = None,
) -> Page[InstitutionResponse]:
    """Retorna instituições com filtros geográficos, de área e intercâmbio."""
    result = await CatalogRepository(session).list_institutions(
        page=page, page_size=page_size, continent=continent, country=country,
        subject_area=subject_area, exchange_available=exchange_available,
    )
    return Page[InstitutionResponse](items=result.items, page=page, page_size=page_size, total=result.total)


@router.get(
    "/institutions/{external_id}",
    response_model=InstitutionResponse,
    responses=CATALOG_ERROR_RESPONSES,
    summary="Busca uma instituição pelo identificador da fonte",
)
async def get_institution(external_id: str, session: SessionDependency) -> InstitutionResponse:
    institution = await CatalogRepository(session).get_institution(external_id)
    if institution is None:
        raise HTTPException(status_code=404, detail="Institution not found.")
    return institution

"""Endpoint de disponibilidade da aplicação."""

from fastapi import APIRouter
from pydantic import BaseModel

from viajaufsc_api.errors import ERROR_RESPONSES


router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: str


@router.get(
    "/health",
    response_model=HealthResponse,
    responses=ERROR_RESPONSES,
    summary="Verifica se a API está em execução",
)
async def health_check() -> HealthResponse:
    """Não acessa o banco para permanecer disponível durante diagnósticos."""

    return HealthResponse(status="ok")

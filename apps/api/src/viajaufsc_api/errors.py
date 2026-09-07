"""Formato de falhas exposto pela API."""

from typing import Any

from pydantic import BaseModel


class ErrorBody(BaseModel):
    """Detalhes seguros e estáveis para consumidores HTTP."""

    code: str
    message: str
    details: Any | None = None


class ErrorResponse(BaseModel):
    """Envelope padronizado para respostas de erro."""

    error: ErrorBody


ERROR_RESPONSES = {
    404: {"model": ErrorResponse, "description": "Recurso não encontrado."},
    422: {"model": ErrorResponse, "description": "Parâmetros inválidos."},
    500: {"model": ErrorResponse, "description": "Erro interno."},
}

CATALOG_ERROR_RESPONSES = ERROR_RESPONSES | {
    503: {"model": ErrorResponse, "description": "Banco de dados não configurado."},
}

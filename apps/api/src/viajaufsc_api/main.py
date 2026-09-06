"""Fábrica da aplicação FastAPI."""

import logging
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from viajaufsc_api.config import Settings, get_settings
from viajaufsc_api.errors import ERROR_RESPONSES, ErrorBody, ErrorResponse
from viajaufsc_api.routers.health import router as health_router

logger = logging.getLogger(__name__)


def _error_response(
    *, status_code: int, code: str, message: str, details: Any = None
) -> JSONResponse:
    payload = ErrorResponse(
        error=ErrorBody(code=code, message=message, details=details)
    )
    return JSONResponse(status_code=status_code, content=payload.model_dump(exclude_none=True))


def create_app(settings: Settings | None = None) -> FastAPI:
    """Cria a aplicação configurada, facilitando isolamento nos testes."""

    app_settings = settings or get_settings()
    app = FastAPI(
        title=app_settings.app_name,
        version="0.1.0",
        description="API para consulta dos dados públicos coletados da SINTER/UFSC.",
        openapi_url=f"{app_settings.api_v1_prefix}/openapi.json",
        docs_url=f"{app_settings.api_v1_prefix}/docs",
        redoc_url=f"{app_settings.api_v1_prefix}/redoc",
    )

    if app_settings.cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=app_settings.cors_origins,
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            allow_headers=["*"],
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        _: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        detail = exc.detail if isinstance(exc.detail, dict) else None
        message = exc.detail if isinstance(exc.detail, str) else "Request failed."
        return _error_response(
            status_code=exc.status_code,
            code="http_error",
            message=message,
            details=detail,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        _: Request, exc: RequestValidationError
    ) -> JSONResponse:
        return _error_response(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code="validation_error",
            message="Request validation failed.",
            details=exc.errors(),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled API exception", exc_info=exc)
        return _error_response(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="internal_error",
            message="An unexpected error occurred.",
        )

    app.include_router(health_router, prefix=app_settings.api_v1_prefix)
    return app


app = create_app()

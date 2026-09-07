"""Criação explícita de recursos assíncronos do SQLAlchemy.

Nenhuma conexão é criada ao importar este módulo. A aplicação deverá criar e
encerrar a instância de :class:`Database` no seu ciclo de vida.
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from dataclasses import dataclass

from sqlalchemy.engine import URL, make_url
from sqlalchemy.exc import ArgumentError
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from viajaufsc_api.config import Settings


class DatabaseConfigurationError(RuntimeError):
    """Base class for database configuration failures safe to classify."""


class MissingDatabaseConfigurationError(DatabaseConfigurationError):
    """Raised when the required connection environment variable is absent."""


class InvalidDatabaseConfigurationError(DatabaseConfigurationError):
    """Raised when a connection URL cannot be used by the async runtime."""


_LIBPQ_ONLY_QUERY_ARGUMENTS = frozenset(
    {
        "application_name",
        "channel_binding",
        "connect_timeout",
        "gssencmode",
        "keepalives",
        "keepalives_count",
        "keepalives_idle",
        "keepalives_interval",
        "options",
        "requirepeer",
        "sslcert",
        "sslcrl",
        "sslkey",
        "sslrootcert",
    }
)


def normalize_async_database_url(raw_url: str) -> str:
    """Return a SQLAlchemy async URL without exposing its value in errors.

    Neon supplies standard libpq URLs by default. SQLAlchemy's asyncpg dialect
    needs its explicit driver name, uses ``ssl`` instead of ``sslmode`` and
    cannot receive libpq-only keyword arguments such as ``channel_binding``.
    """

    try:
        url = make_url(raw_url)
    except (ArgumentError, TypeError, ValueError):
        raise InvalidDatabaseConfigurationError(
            "The database URL is invalid."
        ) from None

    if url.drivername in {"postgres", "postgresql", "postgresql+asyncpg"}:
        query = dict(url.query)
        sslmode = query.pop("sslmode", None)
        for argument in _LIBPQ_ONLY_QUERY_ARGUMENTS:
            query.pop(argument, None)
        if sslmode is not None and "ssl" not in query:
            query["ssl"] = sslmode
        normalized: URL = url.set(drivername="postgresql+asyncpg", query=query)
        return normalized.render_as_string(hide_password=False)

    if url.drivername == "sqlite+aiosqlite":
        return url.render_as_string(hide_password=False)

    raise InvalidDatabaseConfigurationError(
        "The database URL must use PostgreSQL/asyncpg."
    )


def migration_database_url(settings: Settings) -> str:
    """Choose a direct URL, except for SQLite-only offline migrations."""

    raw_url = settings.database_url_unpooled
    if raw_url:
        return normalize_async_database_url(raw_url)

    if settings.database_url:
        normalized_fallback = normalize_async_database_url(settings.database_url)
        if make_url(normalized_fallback).get_backend_name() == "sqlite":
            return normalized_fallback

    raise MissingDatabaseConfigurationError(
        "DATABASE_URL_UNPOOLED must be configured before running migrations."
    )


@dataclass(slots=True)
class Database:
    """Recursos de conexão compartilhados pela aplicação."""

    engine: AsyncEngine
    session_factory: async_sessionmaker[AsyncSession]

    @asynccontextmanager
    async def session(self) -> AsyncIterator[AsyncSession]:
        """Abre uma sessão com commit/rollback transacional previsível."""
        session = self.session_factory()
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

    async def dispose(self) -> None:
        """Fecha o pool de conexões durante o desligamento da aplicação."""
        await self.engine.dispose()


def create_database(settings: Settings) -> Database:
    """Cria a fábrica de sessões a partir da URL de ambiente.

    A URL precisa usar um dialeto assíncrono, por exemplo
    ``postgresql+asyncpg://`` para Neon ou ``sqlite+aiosqlite://`` nos testes.
    """
    if not settings.database_url:
        raise MissingDatabaseConfigurationError(
            "DATABASE_URL must be configured to access the database."
        )

    database_url = normalize_async_database_url(settings.database_url)
    try:
        engine = create_async_engine(database_url, pool_pre_ping=True)
    except (ArgumentError, TypeError, ValueError):
        raise InvalidDatabaseConfigurationError(
            "The database URL is invalid."
        ) from None
    return Database(
        engine=engine,
        session_factory=async_sessionmaker(engine, expire_on_commit=False),
    )

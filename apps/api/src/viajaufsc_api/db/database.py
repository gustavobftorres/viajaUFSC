"""Criação explícita de recursos assíncronos do SQLAlchemy.

Nenhuma conexão é criada ao importar este módulo. A aplicação deverá criar e
encerrar a instância de :class:`Database` no seu ciclo de vida.
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from viajaufsc_api.config import Settings


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
        raise RuntimeError("VIAJAUFSC_DATABASE_URL must be configured to access the database.")

    engine = create_async_engine(settings.database_url, pool_pre_ping=True)
    return Database(
        engine=engine,
        session_factory=async_sessionmaker(engine, expire_on_commit=False),
    )

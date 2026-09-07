import pytest
from sqlalchemy.engine import make_url

from viajaufsc_api.config import Settings
from viajaufsc_api.db.database import (
    InvalidDatabaseConfigurationError,
    MissingDatabaseConfigurationError,
    migration_database_url,
    normalize_async_database_url,
)


def test_normalizes_standard_neon_url_for_asyncpg() -> None:
    normalized = normalize_async_database_url(
        "postgresql://user:password@ep-example-pooler.us-east-2.aws.neon.tech/db"
        "?sslmode=require&channel_binding=require&connect_timeout=10"
    )

    url = make_url(normalized)
    assert url.drivername == "postgresql+asyncpg"
    assert url.username == "user"
    assert url.password == "password"
    assert url.query == {"ssl": "require"}


def test_invalid_database_url_error_does_not_include_secret() -> None:
    secret = "do-not-print-this"

    with pytest.raises(InvalidDatabaseConfigurationError) as captured:
        normalize_async_database_url(f"mysql://user:{secret}@example.test/db")

    assert secret not in str(captured.value)


def test_migrations_prefer_unpooled_url() -> None:
    settings = Settings(
        environment="production",
        database_url="postgresql://user:password@pooler.example.test/db",
        database_url_unpooled="postgresql://user:password@direct.example.test/db",
    )

    assert make_url(migration_database_url(settings)).host == "direct.example.test"


def test_migrations_allow_application_url_fallback_for_sqlite() -> None:
    settings = Settings(
        environment="test",
        database_url="sqlite+aiosqlite:///migration-test.db",
    )

    assert migration_database_url(settings) == "sqlite+aiosqlite:///migration-test.db"


def test_migrations_require_unpooled_url_in_production() -> None:
    settings = Settings(
        environment="production",
        database_url="postgresql://user:password@pooler.example.test/db",
    )

    with pytest.raises(MissingDatabaseConfigurationError):
        migration_database_url(settings)


def test_migrations_reject_postgres_fallback_in_default_environment() -> None:
    settings = Settings(
        database_url="postgresql://user:password@pooler.example.test/db",
    )

    with pytest.raises(MissingDatabaseConfigurationError):
        migration_database_url(settings)


def test_migrations_reject_postgres_fallback_in_local_environment() -> None:
    settings = Settings(
        environment="local",
        database_url="postgresql://user:password@localhost/db",
    )

    with pytest.raises(MissingDatabaseConfigurationError):
        migration_database_url(settings)

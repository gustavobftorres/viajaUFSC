from viajaufsc_api.config import Settings


def test_database_url_accepts_standard_environment_name(monkeypatch) -> None:
    monkeypatch.delenv("VIAJAUFSC_DATABASE_URL", raising=False)
    monkeypatch.setenv("DATABASE_URL", "sqlite+aiosqlite:///standard-name.db")

    settings = Settings(_env_file=None)

    assert settings.database_url == "sqlite+aiosqlite:///standard-name.db"


def test_unpooled_url_accepts_standard_environment_name(monkeypatch) -> None:
    monkeypatch.delenv("VIAJAUFSC_DATABASE_URL_UNPOOLED", raising=False)
    monkeypatch.setenv(
        "DATABASE_URL_UNPOOLED", "postgresql://user:password@direct.example.test/db"
    )

    settings = Settings(_env_file=None)

    assert settings.database_url_unpooled is not None
    assert "direct.example.test" in settings.database_url_unpooled

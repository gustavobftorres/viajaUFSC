from __future__ import annotations

from dataclasses import replace
import threading

import pytest
from requests.exceptions import RequestException
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from sinter_collector.models import Agreement, Notice
from sinter_collector.errors import SourceStructureError
from viajaufsc_api.collector import (
    collect,
    main,
    persist_agreements,
    persist_notices,
    run,
)
from viajaufsc_api.config import Settings
from viajaufsc_api.db.database import create_database
from viajaufsc_api.db.database import InvalidDatabaseConfigurationError
from viajaufsc_api.db.models import Base, Institution, Opportunity


@pytest.fixture
async def database(tmp_path):
    database = create_database(
        Settings(database_url=f"sqlite+aiosqlite:///{tmp_path / 'collector.db'}")
    )
    async with database.engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    yield database
    await database.dispose()


def notice(*, title: str = "Edital de mobilidade") -> Notice:
    return Notice(
        external_id="notice-1",
        title=title,
        source_url="https://sinter.example/notices",
        status="open",
    )


def agreement(*, details: str | None = None) -> Agreement:
    return Agreement(
        external_id="agreement-1",
        institution="Universidade Exemplo",
        continent="Europa",
        country="Portugal",
        source_url="https://sinter.example/agreements",
        details=details,
    )


async def test_persist_batches_report_changes_and_unchanged(database) -> None:
    first_notices = await persist_notices(database, [notice()])
    repeated_notices = await persist_notices(database, [notice()])
    changed_notices = await persist_notices(
        database, [replace(notice(), title="Edital atualizado")]
    )
    first_agreements = await persist_agreements(database, [agreement()])
    repeated_agreements = await persist_agreements(database, [agreement()])

    assert (first_notices.changed, first_notices.unchanged) == (1, 0)
    assert (repeated_notices.changed, repeated_notices.unchanged) == (0, 1)
    assert (changed_notices.changed, changed_notices.unchanged) == (1, 0)
    assert (first_agreements.changed, first_agreements.unchanged) == (1, 0)
    assert (repeated_agreements.changed, repeated_agreements.unchanged) == (0, 1)

    async with database.session() as session:
        saved_notice = await session.get(Opportunity, "notice-1")
        saved_agreement = await session.get(Institution, "agreement-1")
    assert saved_notice.title == "Edital atualizado"
    assert saved_agreement.name == "Universidade Exemplo"


async def test_collect_uses_fetchers_without_live_sinter(database) -> None:
    clients: list[object] = []
    event_loop_thread = threading.get_ident()
    fetch_threads: list[int] = []

    class FakeHttpClient:
        def __enter__(self):
            clients.append(self)
            return self

        def __exit__(self, *_args):
            return None

    def fetch_notices(_client):
        fetch_threads.append(threading.get_ident())
        return [notice()]

    def fetch_agreements(_client):
        fetch_threads.append(threading.get_ident())
        return [agreement()]

    results = await collect(
        "all",
        database,
        client_factory=FakeHttpClient,
        notice_fetcher=fetch_notices,
        agreement_fetcher=fetch_agreements,
    )

    assert len(clients) == 1
    assert all(thread_id != event_loop_thread for thread_id in fetch_threads)
    assert results["notices"].changed == 1
    assert results["agreements"].changed == 1
    async with database.session() as session:
        assert len((await session.scalars(select(Opportunity))).all()) == 1
        assert len((await session.scalars(select(Institution))).all()) == 1


def test_main_requires_database_configuration(monkeypatch, capsys) -> None:
    monkeypatch.delenv("VIAJAUFSC_DATABASE_URL", raising=False)
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setattr(
        "viajaufsc_api.collector.get_settings", lambda: Settings(_env_file=None)
    )

    assert main(["notices"]) == 2
    captured = capsys.readouterr()
    assert "DATABASE_URL" in captured.err
    assert captured.out == ""


def test_main_reports_changed_and_unchanged(monkeypatch, capsys) -> None:
    async def fake_run(_collector):
        from viajaufsc_api.collector import CollectionResult

        return {
            "notices": CollectionResult(changed=3, unchanged=2),
            "agreements": CollectionResult(changed=4, unchanged=1),
        }

    monkeypatch.setattr("viajaufsc_api.collector.run", fake_run)

    assert main(["all"]) == 0
    output = capsys.readouterr().out
    assert "Editais processados: 3 alterados, 2 inalterados" in output
    assert "Convênios processados: 4 alterados, 1 inalterados" in output


@pytest.mark.parametrize(
    ("error", "expected_message", "exit_code"),
    [
        (SourceStructureError("secret source details"), "estrutura da fonte", 1),
        (
            InvalidDatabaseConfigurationError("postgresql://user:secret@host/db"),
            "Erro de configuração",
            2,
        ),
        (ValueError("secret collector setting"), "configuração do coletor", 2),
        (RequestException("https://secret.example"), "consultar as fontes", 1),
        (SQLAlchemyError("postgresql://user:secret@host/db"), "persistir", 1),
        (Exception("secret unexpected value"), "Erro inesperado", 1),
    ],
)
def test_main_sanitizes_failures(
    monkeypatch, capsys, error, expected_message, exit_code
) -> None:
    async def fail(_collector):
        raise error

    monkeypatch.setattr("viajaufsc_api.collector.run", fail)

    assert main(["notices"]) == exit_code
    captured = capsys.readouterr()
    assert expected_message in captured.err
    assert "secret" not in captured.err
    assert "Traceback" not in captured.err
    assert captured.out == ""


async def test_run_always_disposes_database(monkeypatch) -> None:
    class FakeDatabase:
        disposed = False

        async def dispose(self) -> None:
            self.disposed = True

    fake_database = FakeDatabase()

    async def broken_collect(*_args, **_kwargs):
        raise RuntimeError("fetch failed")

    monkeypatch.setattr(
        "viajaufsc_api.collector.create_database", lambda _settings: fake_database
    )
    monkeypatch.setattr("viajaufsc_api.collector.collect", broken_collect)

    with pytest.raises(RuntimeError, match="fetch failed"):
        await run("notices", settings=Settings(database_url="sqlite+aiosqlite://"))

    assert fake_database.disposed is True

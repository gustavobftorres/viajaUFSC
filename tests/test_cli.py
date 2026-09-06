from sinter_collector.cli import main


def test_init_db_command_creates_database(tmp_path) -> None:
    path = tmp_path / "sinter.db"
    assert main(["--database", str(path), "init-db"]) == 0
    assert path.exists()


def test_collect_notices_command(monkeypatch, tmp_path, capsys) -> None:
    class FakeHttpClient:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return None

    monkeypatch.setattr("sinter_collector.cli.HttpClient", FakeHttpClient)
    monkeypatch.setattr("sinter_collector.cli.collect_notices", lambda client, database: (3, 2))

    path = tmp_path / "sinter.db"
    assert main(["--database", str(path), "collect", "notices"]) == 0
    assert "3 alterados, 2 inalterados" in capsys.readouterr().out


def test_collect_agreements_command(monkeypatch, tmp_path, capsys) -> None:
    class FakeHttpClient:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return None

    monkeypatch.setattr("sinter_collector.cli.HttpClient", FakeHttpClient)
    monkeypatch.setattr(
        "sinter_collector.cli.collect_agreements", lambda client, database: (4, 1)
    )

    path = tmp_path / "sinter.db"
    assert main(["--database", str(path), "collect", "agreements"]) == 0
    assert "4 alterados, 1 inalterados" in capsys.readouterr().out


def test_collect_all_runs_both_collectors_with_one_client(monkeypatch, tmp_path) -> None:
    clients = []

    class FakeHttpClient:
        def __enter__(self):
            clients.append(self)
            return self

        def __exit__(self, *_args):
            return None

    calls = []
    monkeypatch.setattr("sinter_collector.cli.HttpClient", FakeHttpClient)
    monkeypatch.setattr(
        "sinter_collector.cli.collect_notices",
        lambda client, database: calls.append(("notices", client, database.path)) or (1, 0),
    )
    monkeypatch.setattr(
        "sinter_collector.cli.collect_agreements",
        lambda client, database: calls.append(("agreements", client, database.path)) or (2, 0),
    )

    path = tmp_path / "sinter.db"
    assert main(["--database", str(path), "collect", "all"]) == 0
    assert [call[0] for call in calls] == ["notices", "agreements"]
    assert len(clients) == 1
    assert all(call[1] is clients[0] and call[2] == path for call in calls)

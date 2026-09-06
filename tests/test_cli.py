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

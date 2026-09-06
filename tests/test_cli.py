from sinter_collector.cli import main


def test_init_db_command_creates_database(tmp_path) -> None:
    path = tmp_path / "sinter.db"
    assert main(["--database", str(path), "init-db"]) == 0
    assert path.exists()

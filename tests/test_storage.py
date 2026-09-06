from sinter_collector.models import Agreement, Notice
from sinter_collector.storage import Database


def test_notice_upsert_is_idempotent_and_updates_changed_data(tmp_path) -> None:
    database = Database(tmp_path / "collector.db")
    database.initialize()
    notice = Notice("42", "Primeiro", "https://example.test/notices/42")

    assert database.upsert_notice(notice) is True
    with database.connect() as connection:
        initial = connection.execute(
            "SELECT first_seen_at, updated_at FROM notices WHERE external_id = ?",
            ("42",),
        ).fetchone()
    assert database.upsert_notice(notice) is False
    with database.connect() as connection:
        unchanged = connection.execute(
            "SELECT first_seen_at, updated_at FROM notices WHERE external_id = ?",
            ("42",),
        ).fetchone()
    assert dict(unchanged) == dict(initial)

    assert database.upsert_notice(
        Notice("42", "Atualizado", "https://example.test/notices/42")
    ) is True

    with database.connect() as connection:
        row = connection.execute(
            """SELECT title, source_url, content_hash, first_seen_at, updated_at
               FROM notices WHERE external_id = ?""",
            ("42",),
        ).fetchone()
    assert row["title"] == "Atualizado"
    assert row["source_url"] == "https://example.test/notices/42"
    assert row["content_hash"] == Notice(
        "42", "Atualizado", "https://example.test/notices/42"
    ).record_hash
    assert row["first_seen_at"] == initial["first_seen_at"]
    assert row["updated_at"] > initial["updated_at"]
    assert "." in row["updated_at"]


def test_agreement_upsert_persists_normalized_fields(tmp_path) -> None:
    database = Database(tmp_path / "collector.db")
    database.initialize()
    agreement = Agreement(
        external_id="europe:test-university",
        institution="Test University",
        continent="europe",
        country="Portugal",
        source_url="https://example.test/europe",
        details="Acordo geral",
        canonical_url="https://example.test/university",
        start_date="2026-01-01",
        end_date="2031-01-01",
        agreement_type="bilateral",
        subject_area="Engenharia",
    )

    assert database.upsert_agreement(agreement) is True
    assert database.upsert_agreement(agreement) is False

    with database.connect() as connection:
        row = connection.execute(
            "SELECT canonical_url, start_date, end_date, agreement_type, subject_area "
            "FROM agreements WHERE external_id = ?",
            (agreement.external_id,),
        ).fetchone()
    assert dict(row) == {
        "canonical_url": "https://example.test/university",
        "start_date": "2026-01-01",
        "end_date": "2031-01-01",
        "agreement_type": "bilateral",
        "subject_area": "Engenharia",
    }

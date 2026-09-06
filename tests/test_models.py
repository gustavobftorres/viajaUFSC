from sinter_collector.models import Notice


def test_record_hash_is_stable_and_changes_with_content() -> None:
    original = Notice("10", "Edital", "https://example.test/10", body="Texto")
    equal = Notice("10", "Edital", "https://example.test/10", body="Texto")
    changed = Notice("10", "Edital atualizado", "https://example.test/10", body="Texto")

    assert original.record_hash == equal.record_hash
    assert original.record_hash != changed.record_hash

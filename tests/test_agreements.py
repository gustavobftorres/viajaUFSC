from pathlib import Path

import pytest

from sinter_collector.agreements import (
    AGREEMENT_PAGES,
    collect_agreements,
    fetch_agreements,
    parse_agreements,
)
from sinter_collector.errors import SourceStructureError
from sinter_collector.storage import Database


FIXTURES = Path(__file__).parent / "fixtures"


class FakeResponse:
    def __init__(self, text: str) -> None:
        self.text = text


class FakeClient:
    def __init__(self, html: str) -> None:
        self.html = html
        self.calls: list[tuple[str, dict[str, object]]] = []

    def get(self, url: str, **kwargs: object) -> FakeResponse:
        self.calls.append((url, kwargs))
        return FakeResponse(self.html)


def fixture(name: str) -> str:
    return (FIXTURES / name).read_text(encoding="utf-8")


def test_official_page_list_contains_the_seven_real_slugs() -> None:
    assert [slug for slug, _continent, _url in AGREEMENT_PAGES] == [
        "africa",
        "america-central",
        "america-do-norte",
        "america-do-sul",
        "asia",
        "europa",
        "oceania",
    ]
    assert all(url.endswith(f"/{slug}/?lang=pt") for slug, _, url in AGREEMENT_PAGES)


def test_parse_realistic_cards_normalizes_fields_and_urls() -> None:
    source = "https://sinter.ufsc.br/instituicoes-conveniadas/africa/?lang=pt"
    agreements = parse_agreements(
        fixture("agreements_cards.html"), continent="África", source_url=source
    )

    assert len(agreements) == 2
    first = agreements[0]
    assert first.institution == "Universidade de Cabo Verde (UniCV)"
    assert first.country == "Cabo Verde"
    assert first.continent == "África"
    assert first.start_date == "2026-05-25"
    assert first.end_date == "2031-05-25"
    assert first.canonical_url == "http://www.unicv.edu.cv/pt/"
    assert first.subject_area == "Todas as áreas do conhecimento em comum"
    assert "area: Todas as áreas" in first.details
    assert "disponibilidade para intercambio: Sim" in first.details
    assert "maps.google" not in first.details

    second = agreements[1]
    assert second.country == "Angola"
    assert second.canonical_url == "https://sinter.ufsc.br/instituicao/isuppa"
    assert second.start_date == "2025-10-08"
    assert second.end_date == "2030-10-08"
    assert second.agreement_type == "Acordo geral"
    assert "observacoes:" in second.details


def test_parser_tolerates_missing_optional_fields_and_unknown_date() -> None:
    agreement = parse_agreements(
        fixture("agreements_minimal.html"),
        continent="Europa",
        source_url="https://sinter.ufsc.br/instituicoes-conveniadas/europa/?lang=pt",
    )[0]

    assert agreement.country == "Portugal"
    assert agreement.start_date == "data a confirmar"
    assert agreement.end_date is None
    assert agreement.canonical_url is None
    assert agreement.details is None


def test_parser_fails_when_maintenance_page_has_no_agreement_structure() -> None:
    with pytest.raises(SourceStructureError, match="no recognizable agreement cards"):
        parse_agreements(
            "<html><body><p>Em manutenção</p></body></html>",
            continent="Europa",
            source_url="https://example.test/europa",
        )


def test_parser_fails_when_container_has_no_recognizable_cards() -> None:
    with pytest.raises(SourceStructureError, match="no recognizable agreement cards"):
        parse_agreements(
            '<div id="accordiondiv"><p>Conteúdo temporariamente indisponível</p></div>',
            continent="Europa",
            source_url="https://example.test/europa",
        )


def test_parser_infers_specific_type_from_public_description() -> None:
    html = fixture("agreements_minimal.html").replace(
        "</table>",
        "<tr><td><b>Observações:</b> Acordo de Dupla Diplomação em Engenharia.</td></tr>"
        "</table>",
    )
    agreement = parse_agreements(
        html,
        continent="Europa",
        source_url="https://sinter.ufsc.br/instituicoes-conveniadas/europa/?lang=pt",
    )[0]

    assert agreement.agreement_type == "dupla diplomação"


def test_identity_is_stable_when_mutable_agreement_data_changes() -> None:
    source = "https://sinter.ufsc.br/instituicoes-conveniadas/africa/?lang=pt"
    before = parse_agreements(
        fixture("agreements_cards.html"), continent="África", source_url=source
    )[0]
    changed_html = fixture("agreements_cards.html").replace("25/05/2031", "25/05/2032")
    after = parse_agreements(changed_html, continent="África", source_url=source)[0]

    assert after.external_id == before.external_id
    assert after.record_hash != before.record_hash


def duplicate_cards(areas: list[str]) -> str:
    cards = "".join(
        f"""
        <table>
          <tr><td><b>Instituicão:</b> Institut National Polytechnique de Toulouse (INP)</td></tr>
          <tr><td><b>Área:</b> {area}</td></tr>
          <tr><td><b>Site:</b> <a href="https://www.inp-toulouse.fr/">Site</a></td></tr>
          <tr><td><b>Início:</b> 22/03/2021</td></tr>
          <tr><td><b>Término:</b> 22/03/2031</td></tr>
          <tr><td><b>Observações:</b> Dupla Diplomação na área de {area}.</td></tr>
        </table>
        """
        for area in areas
    )
    return f'<div id="accordiondiv"><h3>França</h3><div>{cards}</div></div>'


def ids_by_area(html: str) -> dict[str, str]:
    agreements = parse_agreements(
        html,
        continent="Europa",
        source_url="https://sinter.ufsc.br/instituicoes-conveniadas/europa/?lang=pt",
    )
    return {item.subject_area: item.external_id for item in agreements}  # type: ignore[misc]


def test_duplicate_institutions_keep_ids_when_cards_are_reordered() -> None:
    original = ids_by_area(duplicate_cards(["Engenharia Elétrica", "Engenharia Química"]))
    reordered = ids_by_area(duplicate_cards(["Engenharia Química", "Engenharia Elétrica"]))

    assert reordered == original


def test_duplicate_id_ignores_mutable_dates_and_note_wording() -> None:
    before = duplicate_cards(["Engenharia Elétrica"])
    after = before.replace("22/03/2031", "22/03/2036").replace(
        "Dupla Diplomação na área de Engenharia Elétrica.",
        "Convênio renovado; cinco vagas por ano.",
    )

    assert ids_by_area(after) == ids_by_area(before)


def test_agreement_without_area_keeps_id_when_notes_add_inferred_type(tmp_path) -> None:
    source = "https://sinter.ufsc.br/instituicoes-conveniadas/europa/?lang=pt"
    before_html = """
        <div id="accordiondiv"><h3>França</h3><div><table>
          <tr><td><b>Instituicão:</b> Université Exemple</td></tr>
          <tr><td><b>Observações:</b> Convênio acadêmico.</td></tr>
        </table></div></div>
    """
    after_html = before_html.replace(
        "Convênio acadêmico.", "Convênio acadêmico de dupla diplomação."
    )
    before = parse_agreements(before_html, continent="Europa", source_url=source)[0]
    after = parse_agreements(after_html, continent="Europa", source_url=source)[0]

    assert before.subject_area is None
    assert before.agreement_type is None
    assert after.agreement_type == "dupla diplomação"
    assert after.external_id == before.external_id
    assert after.record_hash != before.record_hash

    database = Database(tmp_path / "mutable-notes.db")
    database.initialize()
    assert database.upsert_agreement(before) is True
    assert database.upsert_agreement(after) is True
    with database.connect() as connection:
        rows = connection.execute(
            "SELECT external_id, agreement_type FROM agreements"
        ).fetchall()
    assert [dict(row) for row in rows] == [
        {"external_id": before.external_id, "agreement_type": "dupla diplomação"}
    ]


def test_inserting_duplicate_institution_does_not_change_previous_ids() -> None:
    original = ids_by_area(duplicate_cards(["Engenharia Elétrica", "Engenharia Química"]))
    inserted = ids_by_area(
        duplicate_cards(
            ["Engenharia Elétrica", "Engenharia de Controle e Automação", "Engenharia Química"]
        )
    )

    assert inserted["Engenharia Elétrica"] == original["Engenharia Elétrica"]
    assert inserted["Engenharia Química"] == original["Engenharia Química"]
    assert len(set(inserted.values())) == 3


def test_duplicate_institution_collection_remains_idempotent(tmp_path) -> None:
    database = Database(tmp_path / "duplicates.db")
    html = duplicate_cards(
        ["Engenharia Elétrica", "Engenharia de Controle e Automação", "Engenharia Química"]
    )

    class SevenPageClient(FakeClient):
        pass

    assert collect_agreements(SevenPageClient(html), database) == (21, 0)  # type: ignore[arg-type]
    assert collect_agreements(SevenPageClient(html), database) == (0, 21)  # type: ignore[arg-type]


def test_fetch_orchestrates_all_seven_pages_in_declared_order() -> None:
    client = FakeClient(fixture("agreements_minimal.html"))

    agreements = fetch_agreements(client)  # type: ignore[arg-type]

    assert len(agreements) == 7
    assert client.calls == [
        (url, {"headers": {"Accept": "text/html"}})
        for _slug, _continent, url in AGREEMENT_PAGES
    ]
    assert [item.continent for item in agreements] == [
        continent for _slug, continent, _url in AGREEMENT_PAGES
    ]


def test_collect_flow_is_idempotent_and_persists_normalized_fields(tmp_path) -> None:
    client = FakeClient(fixture("agreements_cards.html"))
    database = Database(tmp_path / "agreements.db")

    assert collect_agreements(client, database) == (14, 0)  # type: ignore[arg-type]
    assert collect_agreements(client, database) == (0, 14)  # type: ignore[arg-type]

    with database.connect() as connection:
        rows = connection.execute(
            "SELECT institution, canonical_url, start_date, end_date, agreement_type "
            "FROM agreements"
        ).fetchall()
    assert len(rows) == 14
    assert any(row["agreement_type"] == "Acordo geral" for row in rows)

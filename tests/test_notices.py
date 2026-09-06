import json
from pathlib import Path

import pytest

from sinter_collector.errors import SourceStructureError
from sinter_collector.notices import (
    NOTICES_API_URL,
    collect_notices,
    fetch_notices,
    parse_notices,
)
from sinter_collector.storage import Database


FIXTURE = Path(__file__).parent / "fixtures" / "notices_page.json"


def load_fixture() -> dict[str, object]:
    return json.loads(FIXTURE.read_text(encoding="utf-8"))


class FakeResponse:
    def __init__(self, payload: object) -> None:
        self.payload = payload

    def json(self) -> object:
        return self.payload


class FakeClient:
    def __init__(self, payload: object) -> None:
        self.payload = payload
        self.calls: list[tuple[str, dict[str, object]]] = []

    def get(self, url: str, **kwargs: object) -> FakeResponse:
        self.calls.append((url, kwargs))
        return FakeResponse(self.payload)


def test_parse_notices_normalizes_realistic_wordpress_tables() -> None:
    notices = parse_notices(load_fixture())

    assert len(notices) == 5
    first = notices[0]
    assert first.title == "Intercâmbio internacional acadêmico"
    assert first.program == "Intercâmbio internacional acadêmico"
    assert first.link_text == "EDITAL Nº 9/SINTER/2026"
    assert first.audience == "Estudantes de graduação da UFSC"
    assert first.application_deadline == "2026-09-02"
    assert first.deadline_text == "2/9/2026"
    assert first.kind == "edital"
    assert first.status == "open"
    assert first.source_url == NOTICES_API_URL
    assert first.canonical_url == "https://arquivos.ufsc.br/f/abc/"

    relative_link = notices[1]
    assert relative_link.canonical_url == "https://sinter.ufsc.br/files/2026/04/Edital.pdf"
    assert relative_link.application_deadline is None
    assert relative_link.deadline_text == "Verificar prazo da instituição de destino"

    invalid_date = notices[2]
    assert invalid_date.title == "Mobilidade virtual"
    assert invalid_date.link_text == "Clique aqui"
    assert invalid_date.kind == "chamada"
    assert invalid_date.status == "open"
    assert invalid_date.application_deadline is None
    assert invalid_date.deadline_text == "31/02/2026"

    course = notices[3]
    assert course.title == "Cursos do NILT/SINTER"
    assert course.link_text == "Página de cursos abertos"
    assert course.canonical_url == "https://example.edu/cursos"

    closed = notices[4]
    assert closed.kind == "edital"
    assert closed.status == "closed"


def test_parse_notices_requires_rendered_content() -> None:
    with pytest.raises(SourceStructureError, match="content.rendered"):
        parse_notices({"content": {}})


@pytest.mark.parametrize(
    "html",
    [
        "<main><p>Conteúdo temporariamente indisponível.</p></main>",
        "<table><tr><th>Programa</th><th>Edital</th></tr></table>",
        "<table><tr><th>Coluna desconhecida</th></tr><tr><td>Valor</td></tr></table>",
    ],
)
def test_parse_notices_fails_when_page_has_no_recognizable_rows(html: str) -> None:
    payload = {
        "link": "https://sinter.ufsc.br/editais-abertos/?lang=pt",
        "content": {"rendered": html},
    }

    with pytest.raises(SourceStructureError, match="no recognizable notice rows"):
        parse_notices(payload)


def test_fetch_uses_exact_api_and_requests_json() -> None:
    client = FakeClient(load_fixture())

    notices = fetch_notices(client)  # type: ignore[arg-type]

    assert len(notices) == 5
    assert client.calls == [(NOTICES_API_URL, {"headers": {"Accept": "application/json"}})]


def test_collect_flow_is_idempotent_with_local_fixture(tmp_path) -> None:
    client = FakeClient(load_fixture())
    database = Database(tmp_path / "sinter.db")

    assert collect_notices(client, database) == (5, 0)  # type: ignore[arg-type]
    assert collect_notices(client, database) == (0, 5)  # type: ignore[arg-type]

    with database.connect() as connection:
        rows = connection.execute(
            "SELECT title, status, canonical_url FROM notices ORDER BY title"
        ).fetchall()
    assert len(rows) == 5
    assert {row["status"] for row in rows} == {"open", "closed"}


def test_changed_fixture_updates_existing_notice(tmp_path) -> None:
    payload = load_fixture()
    database = Database(tmp_path / "sinter.db")
    assert collect_notices(FakeClient(payload), database) == (5, 0)  # type: ignore[arg-type]

    payload["content"]["rendered"] = payload["content"]["rendered"].replace(  # type: ignore[index]
        "Comunidade universitária", "Toda a comunidade universitária", 1
    )
    assert collect_notices(FakeClient(payload), database) == (1, 4)  # type: ignore[arg-type]


def test_link_label_change_keeps_identity_when_semantic_title_and_url_are_stable() -> None:
    before = parse_notices(load_fixture())[0]
    payload = load_fixture()
    payload["content"]["rendered"] = payload["content"]["rendered"].replace(  # type: ignore[index]
        "EDITAL Nº 9/SINTER/2026", "EDITAL Nº 9/SINTER/2026 — retificado"
    )
    after = parse_notices(payload)[0]

    assert after.link_text.endswith("retificado")
    assert after.external_id == before.external_id


def test_duplicate_fallback_urls_get_unique_and_repeatable_ids(tmp_path) -> None:
    payload = {
        "link": "https://sinter.ufsc.br/editais-abertos/?lang=pt",
        "content": {
            "rendered": """
                <h2>Editais abertos</h2>
                <table>
                  <tr><th>Programa</th><th>Edital</th><th>Público-alvo</th><th>Prazo</th></tr>
                  <tr><td>Mesmo programa</td><td>Sem link</td><td>Graduação</td><td>1/2/2027</td></tr>
                  <tr><td>Mesmo programa</td><td>Sem link</td><td>Graduação</td><td>1/2/2027</td></tr>
                </table>
            """
        },
    }

    first_parse = parse_notices(payload)
    second_parse = parse_notices(payload)
    assert len({notice.external_id for notice in first_parse}) == 2
    assert [notice.external_id for notice in first_parse] == [
        notice.external_id for notice in second_parse
    ]
    assert all(notice.application_deadline == "2027-02-01" for notice in first_parse)

    database = Database(tmp_path / "duplicates.db")
    assert collect_notices(FakeClient(payload), database) == (2, 0)  # type: ignore[arg-type]
    assert collect_notices(FakeClient(payload), database) == (0, 2)  # type: ignore[arg-type]


def test_open_notice_becoming_closed_updates_the_same_row(tmp_path) -> None:
    open_payload = {
        "link": "https://sinter.ufsc.br/editais-abertos/?lang=pt",
        "content": {
            "rendered": """
                <h2>Editais abertos</h2>
                <table>
                  <tr><th>Programa</th><th>Edital</th><th>Público-alvo</th><th>Prazo</th></tr>
                  <tr>
                    <td>Programa em transição</td>
                    <td><a href="https://example.edu/notice">Edital 1/2027</a></td>
                    <td>Graduação</td><td>1/2/2027</td>
                  </tr>
                </table>
            """
        },
    }
    closed_payload = {
        **open_payload,
        "content": {
            "rendered": open_payload["content"]["rendered"].replace(  # type: ignore[index]
                "Editais abertos", "Editais encerrados 2027"
            )
        },
    }

    open_notice = parse_notices(open_payload)[0]
    closed_notice = parse_notices(closed_payload)[0]
    assert open_notice.status == "open"
    assert closed_notice.status == "closed"
    assert closed_notice.external_id == open_notice.external_id

    database = Database(tmp_path / "transition.db")
    assert collect_notices(FakeClient(open_payload), database) == (1, 0)  # type: ignore[arg-type]
    assert collect_notices(FakeClient(closed_payload), database) == (1, 0)  # type: ignore[arg-type]
    with database.connect() as connection:
        rows = connection.execute(
            "SELECT external_id, status FROM notices"
        ).fetchall()
    assert [dict(row) for row in rows] == [
        {"external_id": open_notice.external_id, "status": "closed"}
    ]

"""Collector and HTML parser for SINTER notices published through WordPress."""

from __future__ import annotations

from datetime import datetime
from hashlib import sha256
import re
import unicodedata
from urllib.parse import urljoin

from bs4 import BeautifulSoup, Tag

from .errors import SourceStructureError
from .http import HttpClient
from .models import Notice
from .storage import Database


NOTICES_API_URL = "https://sinter.ufsc.br/wp-json/wp/v2/pages/12370?lang=pt"


def _text(value: Tag | str | None) -> str | None:
    if value is None:
        return None
    raw = value.get_text(" ", strip=True) if isinstance(value, Tag) else value
    normalized = " ".join(raw.replace("\xa0", " ").split())
    return normalized or None


def _key(value: str) -> str:
    decomposed = unicodedata.normalize("NFKD", value)
    unaccented = "".join(
        character for character in decomposed if not unicodedata.combining(character)
    )
    return unaccented.lower()


def _section(marker: Tag, current: tuple[str | None, str | None]) -> tuple[str | None, str | None]:
    if marker.name == "span":
        label = _text(marker.get("title")) or _text(marker) or ""
    elif marker.name == "img":
        label = f"{_text(marker.get('alt')) or ''} {marker.get('src', '')}"
    else:
        label = _text(marker) or ""
    normalized = _key(label).replace("-", " ").replace("_", " ")
    kind = current[0]
    if "edita" in normalized:
        kind = "edital"
    elif "chamada" in normalized:
        kind = "chamada"
    elif "curso" in normalized:
        kind = "curso"
    status = current[1]
    if "encerrad" in normalized:
        status = "closed"
    elif "abert" in normalized:
        status = "open"
    return kind, status


def _headers(cells: list[Tag]) -> list[str]:
    return [_key(_text(cell) or "") for cell in cells]


def _field(row: dict[str, Tag], *terms: str) -> Tag | None:
    for header, value in row.items():
        if any(term in header for term in terms):
            return value
    return None


def _deadline(raw: str | None) -> tuple[str | None, str | None]:
    if not raw:
        return None, None
    match = re.fullmatch(r"\s*(\d{1,2})/(\d{1,2})/(\d{4})\s*", raw)
    if not match:
        return None, raw
    try:
        value = datetime.strptime(match.group(0).strip(), "%d/%m/%Y").date()
    except ValueError:
        return None, raw
    return value.isoformat(), raw


def parse_notices(
    payload: dict[str, object], *, source_url: str = NOTICES_API_URL
) -> list[Notice]:
    """Normalize all tabular notices found in a WordPress page response."""
    content = payload.get("content")
    html = content.get("rendered") if isinstance(content, dict) else None
    if not isinstance(html, str):
        raise SourceStructureError(
            f"Notice source {source_url} is missing WordPress content.rendered"
        )

    page_link = payload.get("link") if isinstance(payload.get("link"), str) else source_url
    soup = BeautifulSoup(html, "html.parser")
    result: list[Notice] = []
    section: tuple[str | None, str | None] = (None, None)
    identity_occurrences: dict[str, int] = {}

    for element in soup.find_all(["img", "span", "h1", "h2", "h3", "h4", "table"]):
        if element.name != "table":
            if element.name == "span" and not (
                element.get("title") or "collapseomatic" in element.get("class", [])
            ):
                continue
            section = _section(element, section)
            continue

        rows = element.find_all("tr")
        if len(rows) < 2:
            continue
        header_cells = rows[0].find_all(["th", "td"], recursive=False)
        headers = _headers(header_cells)
        if not headers:
            continue

        for tr in rows[1:]:
            cells = tr.find_all(["th", "td"], recursive=False)
            if not cells or len(cells) != len(headers):
                continue
            fields = dict(zip(headers, cells, strict=True))
            semantic_cell = _field(fields, "programa", "chamada", "curso")
            link_cell = _field(fields, "link", "edital")
            audience_cell = _field(fields, "publico alvo", "publico-alvo")
            deadline_cell = _field(fields, "prazo")

            program = _text(semantic_cell)
            link_text = _text(link_cell)
            title = program or link_text
            if not title:
                continue
            link_source = link_cell or semantic_cell
            link = link_source.find("a", href=True) if link_source else None
            canonical_url = urljoin(page_link, link["href"]) if link else page_link
            audience = _text(audience_cell)
            deadline_raw = _text(deadline_cell)
            application_deadline, deadline_text = _deadline(deadline_raw)
            identity_base = "\n".join(
                (
                    section[0] or "notice",
                    canonical_url,
                    program or title,
                )
            )
            occurrence = identity_occurrences.get(identity_base, 0) + 1
            identity_occurrences[identity_base] = occurrence
            identity = f"{identity_base}\noccurrence:{occurrence}"
            external_id = sha256(identity.encode("utf-8")).hexdigest()
            body_parts = [
                value for value in (program, link_text, audience, deadline_raw) if value
            ]
            result.append(
                Notice(
                    external_id=external_id,
                    title=title,
                    source_url=source_url,
                    canonical_url=canonical_url,
                    kind=section[0],
                    status=section[1],
                    program=program,
                    link_text=link_text,
                    audience=audience,
                    application_deadline=application_deadline,
                    deadline_text=deadline_text,
                    body=" | ".join(body_parts) or None,
                )
            )
    if not result:
        raise SourceStructureError(
            f"Notice source {source_url} contains no recognizable notice rows"
        )
    return result


def fetch_notices(client: HttpClient) -> list[Notice]:
    response = client.get(NOTICES_API_URL, headers={"Accept": "application/json"})
    payload = response.json()
    if not isinstance(payload, dict):
        raise ValueError("WordPress response must be a JSON object")
    return parse_notices(payload)


def collect_notices(client: HttpClient, database: Database) -> tuple[int, int]:
    """Fetch and persist notices, returning (changed, unchanged) counts."""
    database.initialize()
    changed = unchanged = 0
    for notice in fetch_notices(client):
        if database.upsert_notice(notice):
            changed += 1
        else:
            unchanged += 1
    return changed, unchanged

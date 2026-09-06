"""Collector for public SINTER agreements grouped by continent and country."""

from __future__ import annotations

from datetime import datetime
from hashlib import sha256
import re
import unicodedata
from urllib.parse import urljoin

from bs4 import BeautifulSoup, Tag

from .errors import SourceStructureError
from .http import HttpClient
from .models import Agreement
from .storage import Database


AGREEMENT_PAGES: tuple[tuple[str, str, str], ...] = tuple(
    (
        slug,
        label,
        f"https://sinter.ufsc.br/instituicoes-conveniadas/{slug}/?lang=pt",
    )
    for slug, label in (
        ("africa", "África"),
        ("america-central", "América Central"),
        ("america-do-norte", "América do Norte"),
        ("america-do-sul", "América do Sul"),
        ("asia", "Ásia"),
        ("europa", "Europa"),
        ("oceania", "Oceania"),
    )
)


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
    return re.sub(r"[^a-z0-9]+", " ", unaccented.lower()).strip()


def _date(value: str | None) -> str | None:
    if not value:
        return None
    match = re.fullmatch(r"\s*(\d{1,2})/(\d{1,2})/(\d{4})\s*", value)
    if not match:
        return value
    try:
        return datetime.strptime(value.strip(), "%d/%m/%Y").date().isoformat()
    except ValueError:
        return value


def _table_fields(table: Tag) -> tuple[dict[str, str], dict[str, str]]:
    """Return normalized values and first links without depending on table columns."""
    fields: dict[str, str] = {}
    links: dict[str, str] = {}
    for cell in table.find_all(["td", "th"]):
        marker = cell.find(["b", "strong"])
        if marker is None:
            continue
        raw_label = _text(marker)
        if not raw_label:
            continue
        label = _key(raw_label.rstrip(":"))
        full_text = _text(cell) or ""
        value = full_text[len(raw_label) :].lstrip(" :")
        if value:
            fields[label] = value
        link = cell.find("a", href=True)
        if link is not None:
            links[label] = str(link["href"]).strip()
    return fields, links


def _field(fields: dict[str, str], *names: str) -> str | None:
    for name in names:
        wanted = _key(name)
        for label, value in fields.items():
            if label == wanted or wanted in label:
                return value
    return None


def _agreement_type(fields: dict[str, str]) -> str | None:
    explicit = _field(fields, "tipo", "modalidade", "natureza")
    if explicit:
        return explicit
    description = _key(" ".join(fields.values()))
    if "dupla diplomacao" in description:
        return "dupla diplomação"
    if "cotutela" in description:
        return "cotutela"
    if "acordo especifico" in description:
        return "acordo específico"
    return None


def parse_agreements(
    html: str,
    *,
    continent: str,
    source_url: str,
) -> list[Agreement]:
    """Parse agreement cards while tolerating optional and misspelled labels."""
    soup = BeautifulSoup(html, "html.parser")
    # Older snapshots do not always expose the accordion wrapper, so a table
    # with recognizable card labels remains valid.  The no-results guard below
    # still makes maintenance/error pages and incompatible markup fail closed.
    scope = soup.find(id="accordiondiv") or soup
    result: list[Agreement] = []
    for table in scope.find_all("table"):
        fields, links = _table_fields(table)
        institution = _field(fields, "instituicao", "instituicão", "instituição")
        if not institution:
            continue

        heading = table.find_previous("h3")
        country = _text(heading) if heading is not None and heading in scope.find_all("h3") else None
        site_label = next((label for label in links if label in {"site", "website"}), None)
        canonical_url = urljoin(source_url, links[site_label]) if site_label else None
        start_date = _date(_field(fields, "inicio", "vigencia inicial"))
        end_date = _date(_field(fields, "termino", "vigencia final"))
        explicit_type = _field(fields, "tipo", "modalidade", "natureza")
        agreement_type = _agreement_type(fields)
        subject_area = _field(fields, "area", "escopo")

        reserved = {
            "instituicao",
            "instituicão",
            "instituição",
            "site",
            "website",
            "inicio",
            "termino",
            "vigencia inicial",
            "vigencia final",
            "tipo",
            "modalidade",
            "natureza",
            "localizacao",
        }
        details = " | ".join(
            f"{label}: {value}"
            for label, value in fields.items()
            if label not in reserved
        ) or None

        # SINTER does not expose a card permalink or agreement identifier.  The
        # institution, geographic grouping and agreement scope are the durable,
        # intrinsic fields that distinguish the live duplicate
        # institutions (for example, INP Toulouse's separate engineering
        # agreements).  Dates, coordinator, availability and free-form notes
        # deliberately stay out: they change on renewals or ordinary updates.
        # An explicitly labelled type is intrinsic too. Inferred types are
        # intentionally excluded because ordinary edits to notes must not churn
        # an agreement's identity, even when the subject area is absent.
        identity_type = explicit_type
        identity = "\n".join(
            (
                _key(continent),
                _key(country or ""),
                _key(institution),
                _key(identity_type or ""),
                _key(subject_area or ""),
            )
        )
        result.append(
            Agreement(
                external_id=sha256(identity.encode("utf-8")).hexdigest(),
                institution=institution,
                continent=continent,
                country=country,
                source_url=source_url,
                details=details,
                canonical_url=canonical_url,
                start_date=start_date,
                end_date=end_date,
                agreement_type=agreement_type,
                subject_area=subject_area,
            )
        )
    if not result:
        raise SourceStructureError(
            f"Agreement source {source_url} contains no recognizable agreement cards"
        )
    return result


def fetch_agreements(client: HttpClient) -> list[Agreement]:
    agreements: list[Agreement] = []
    for _slug, continent, url in AGREEMENT_PAGES:
        response = client.get(url, headers={"Accept": "text/html"})
        agreements.extend(
            parse_agreements(response.text, continent=continent, source_url=url)
        )
    return agreements


def collect_agreements(client: HttpClient, database: Database) -> tuple[int, int]:
    """Fetch all seven continent pages and persist their agreements."""
    database.initialize()
    changed = unchanged = 0
    for agreement in fetch_agreements(client):
        if database.upsert_agreement(agreement):
            changed += 1
        else:
            unchanged += 1
    return changed, unchanged

"""Production command that stores normalized SINTER data in PostgreSQL."""

from __future__ import annotations

import argparse
import asyncio
from collections.abc import Callable, Sequence
from dataclasses import dataclass
import sys

from requests.exceptions import RequestException
from sqlalchemy.exc import SQLAlchemyError

from sinter_collector.agreements import fetch_agreements
from sinter_collector.errors import SourceStructureError
from sinter_collector.http import HttpClient
from sinter_collector.models import Agreement, Notice
from sinter_collector.notices import fetch_notices
from viajaufsc_api.config import Settings, get_settings
from viajaufsc_api.db.database import (
    Database,
    DatabaseConfigurationError,
    create_database,
)
from viajaufsc_api.db.repositories import SinterRepository


@dataclass(frozen=True, slots=True)
class CollectionResult:
    """Changed and unchanged records for one SINTER source."""

    changed: int
    unchanged: int


async def persist_notices(
    database: Database, notices: Sequence[Notice]
) -> CollectionResult:
    """Persist one fetched notice batch in a single transaction."""

    changed = 0
    async with database.session() as session:
        repository = SinterRepository(session)
        for notice in notices:
            result = await repository.upsert_notice(notice)
            changed += int(result.changed)
    return CollectionResult(changed=changed, unchanged=len(notices) - changed)


async def persist_agreements(
    database: Database, agreements: Sequence[Agreement]
) -> CollectionResult:
    """Persist one fetched agreement batch in a single transaction."""

    changed = 0
    async with database.session() as session:
        repository = SinterRepository(session)
        for agreement in agreements:
            result = await repository.upsert_agreement(agreement)
            changed += int(result.changed)
    return CollectionResult(changed=changed, unchanged=len(agreements) - changed)


async def collect(
    collector: str,
    database: Database,
    *,
    client_factory: Callable[[], HttpClient] = HttpClient,
    notice_fetcher: Callable[[HttpClient], list[Notice]] = fetch_notices,
    agreement_fetcher: Callable[[HttpClient], list[Agreement]] = fetch_agreements,
) -> dict[str, CollectionResult]:
    """Fetch selected sources and persist their normalized records."""

    results: dict[str, CollectionResult] = {}
    with client_factory() as client:
        if collector in {"notices", "all"}:
            notices = await asyncio.to_thread(notice_fetcher, client)
            results["notices"] = await persist_notices(database, notices)
        if collector in {"agreements", "all"}:
            agreements = await asyncio.to_thread(agreement_fetcher, client)
            results["agreements"] = await persist_agreements(database, agreements)
    return results


async def run(
    collector: str,
    *,
    settings: Settings | None = None,
    client_factory: Callable[[], HttpClient] = HttpClient,
    notice_fetcher: Callable[[HttpClient], list[Notice]] = fetch_notices,
    agreement_fetcher: Callable[[HttpClient], list[Agreement]] = fetch_agreements,
) -> dict[str, CollectionResult]:
    """Create database resources, execute a collection, and always dispose them."""

    database = create_database(settings or get_settings())
    try:
        return await collect(
            collector,
            database,
            client_factory=client_factory,
            notice_fetcher=notice_fetcher,
            agreement_fetcher=agreement_fetcher,
        )
    finally:
        await database.dispose()


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Coleta dados públicos da SINTER/UFSC para o PostgreSQL"
    )
    parser.add_argument(
        "collector",
        choices=("notices", "agreements", "all"),
        help="fonte a coletar",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    """Console entry point suitable for cron and container schedulers."""

    args = build_parser().parse_args(argv)
    try:
        results = asyncio.run(run(args.collector))
    except SourceStructureError:
        print("Erro de estrutura da fonte SINTER.", file=sys.stderr)
        return 1
    except DatabaseConfigurationError:
        # Never echo configuration exception values: they may contain secrets.
        print(
            "Erro de configuração: DATABASE_URL ou "
            "VIAJAUFSC_DATABASE_URL deve ser configurada.",
            file=sys.stderr,
        )
        return 2
    except ValueError:
        print("Erro de configuração do coletor.", file=sys.stderr)
        return 2
    except RequestException:
        print("Erro ao consultar as fontes da SINTER.", file=sys.stderr)
        return 1
    except SQLAlchemyError:
        # Driver exceptions can contain connection details. Never echo them.
        print("Erro ao persistir os dados no PostgreSQL.", file=sys.stderr)
        return 1
    except Exception:
        print("Erro inesperado durante a coleta.", file=sys.stderr)
        return 1

    labels = {"notices": "Editais", "agreements": "Convênios"}
    for source, result in results.items():
        print(
            f"{labels[source]} processados: {result.changed} alterados, "
            f"{result.unchanged} inalterados"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

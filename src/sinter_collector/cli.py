"""Command-line entry point suitable for cron or container schedulers."""

from __future__ import annotations

import argparse
from pathlib import Path

from .storage import Database


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Coletor público da SINTER/UFSC")
    parser.add_argument(
        "--database",
        type=Path,
        default=Path("/data/sinter.db"),
        help="caminho do banco SQLite (padrão: /data/sinter.db)",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("init-db", help="cria/atualiza o schema do banco")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if args.command == "init-db":
        Database(args.database).initialize()
        print(f"Banco inicializado em {args.database}")
        return 0
    return 2


if __name__ == "__main__":
    raise SystemExit(main())

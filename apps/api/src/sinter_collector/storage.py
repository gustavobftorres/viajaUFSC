"""SQLite persistence with deterministic, idempotent upserts."""

from __future__ import annotations

from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
import sqlite3
from typing import Iterator

from .models import Agreement, Notice


SCHEMA = """
CREATE TABLE IF NOT EXISTS notices (
    external_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT,
    published_at TEXT,
    modified_at TEXT,
    source_url TEXT NOT NULL,
    canonical_url TEXT,
    kind TEXT,
    status TEXT,
    program TEXT,
    link_text TEXT,
    audience TEXT,
    application_deadline TEXT,
    deadline_text TEXT,
    content_hash TEXT NOT NULL,
    first_seen_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS agreements (
    external_id TEXT PRIMARY KEY,
    institution TEXT NOT NULL,
    continent TEXT NOT NULL,
    country TEXT,
    details TEXT,
    source_url TEXT NOT NULL,
    canonical_url TEXT,
    start_date TEXT,
    end_date TEXT,
    agreement_type TEXT,
    subject_area TEXT,
    content_hash TEXT NOT NULL,
    first_seen_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
"""


class Database:
    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)

    @contextmanager
    def connect(self) -> Iterator[sqlite3.Connection]:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(self.path)
        connection.row_factory = sqlite3.Row
        try:
            yield connection
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def initialize(self) -> None:
        with self.connect() as connection:
            connection.executescript(SCHEMA)
            existing = {
                row["name"]
                for row in connection.execute("PRAGMA table_info(notices)").fetchall()
            }
            for column in (
                "canonical_url",
                "kind",
                "status",
                "program",
                "link_text",
                "audience",
                "application_deadline",
                "deadline_text",
            ):
                if column not in existing:
                    connection.execute(f"ALTER TABLE notices ADD COLUMN {column} TEXT")
            agreement_columns = {
                row["name"]
                for row in connection.execute("PRAGMA table_info(agreements)").fetchall()
            }
            for column in (
                "canonical_url",
                "start_date",
                "end_date",
                "agreement_type",
                "subject_area",
            ):
                if column not in agreement_columns:
                    connection.execute(f"ALTER TABLE agreements ADD COLUMN {column} TEXT")

    def upsert_notice(self, notice: Notice) -> bool:
        values = {
            "external_id": notice.external_id,
            "title": notice.title,
            "body": notice.body,
            "published_at": notice.published_at,
            "modified_at": notice.modified_at,
            "source_url": notice.source_url,
            "canonical_url": notice.canonical_url,
            "kind": notice.kind,
            "status": notice.status,
            "program": notice.program,
            "link_text": notice.link_text,
            "audience": notice.audience,
            "application_deadline": notice.application_deadline,
            "deadline_text": notice.deadline_text,
            "content_hash": notice.record_hash,
        }
        return self._upsert("notices", values)

    def upsert_agreement(self, agreement: Agreement) -> bool:
        values = {
            "external_id": agreement.external_id,
            "institution": agreement.institution,
            "continent": agreement.continent,
            "country": agreement.country,
            "details": agreement.details,
            "source_url": agreement.source_url,
            "canonical_url": agreement.canonical_url,
            "start_date": agreement.start_date,
            "end_date": agreement.end_date,
            "agreement_type": agreement.agreement_type,
            "subject_area": agreement.subject_area,
            "content_hash": agreement.record_hash,
        }
        return self._upsert("agreements", values)

    def _upsert(self, table: str, values: dict[str, object]) -> bool:
        """Insert or update only when content changed; return whether it changed."""
        if table not in {"notices", "agreements"}:
            raise ValueError(f"Unsupported table: {table}")

        with self.connect() as connection:
            existing = connection.execute(
                f"SELECT updated_at FROM {table} WHERE external_id = ?",
                (values["external_id"],),
            ).fetchone()
            now = datetime.now(timezone.utc)
            if existing is not None:
                previous = datetime.fromisoformat(existing["updated_at"].replace("Z", "+00:00"))
                if now <= previous:
                    now = previous + timedelta(microseconds=1)
            values = {**values, "updated_at": now.isoformat(timespec="microseconds").replace("+00:00", "Z")}

            columns = list(values)
            placeholders = ", ".join(f":{column}" for column in columns)
            assignments = ", ".join(
                f"{column} = excluded.{column}"
                for column in columns
                if column != "external_id"
            )
            sql = f"""
                INSERT INTO {table} ({', '.join(columns)})
                VALUES ({placeholders})
                ON CONFLICT(external_id) DO UPDATE SET
                    {assignments}
                WHERE {table}.content_hash <> excluded.content_hash
            """
            cursor = connection.execute(sql, values)
            return cursor.rowcount > 0

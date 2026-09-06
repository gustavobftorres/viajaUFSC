"""Normalized records shared by collectors and persistence."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from hashlib import sha256
import json


def content_hash(payload: dict[str, object]) -> str:
    """Return a stable hash for a normalized payload."""
    canonical = json.dumps(
        payload,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )
    return sha256(canonical.encode("utf-8")).hexdigest()


@dataclass(frozen=True, slots=True)
class Notice:
    external_id: str
    title: str
    source_url: str
    body: str | None = None
    published_at: str | None = None
    modified_at: str | None = None

    @property
    def record_hash(self) -> str:
        return content_hash(asdict(self))

@dataclass(frozen=True, slots=True)
class Agreement:
    external_id: str
    institution: str
    continent: str
    country: str | None
    source_url: str
    details: str | None = None

    @property
    def record_hash(self) -> str:
        return content_hash(asdict(self))

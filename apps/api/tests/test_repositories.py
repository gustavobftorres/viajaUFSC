from __future__ import annotations

from dataclasses import dataclass, replace

import pytest
from sqlalchemy import select

from viajaufsc_api.config import Settings
from viajaufsc_api.db.database import create_database
from viajaufsc_api.db.models import Base, Institution, Opportunity
from viajaufsc_api.db.repositories import SinterRepository


@dataclass(frozen=True)
class FakeNotice:
    """Registro normalizado mínimo, sem depender do pacote do coletor."""

    external_id: str
    title: str
    source_url: str
    record_hash: str = "notice-hash-v1"
    canonical_url: str | None = None
    kind: str | None = None
    status: str | None = None
    program: str | None = None
    link_text: str | None = None
    audience: str | None = None
    application_deadline: str | None = None
    deadline_text: str | None = None
    body: str | None = None
    published_at: str | None = None
    modified_at: str | None = None


@dataclass(frozen=True)
class FakeAgreement:
    """Registro de acordo mínimo para exercitar o mapeamento da API."""

    external_id: str
    institution: str
    continent: str
    source_url: str
    record_hash: str = "agreement-hash-v1"
    country: str | None = None
    details: str | None = None
    canonical_url: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    agreement_type: str | None = None
    subject_area: str | None = None


@pytest.fixture
async def database(tmp_path):
    database = create_database(
        Settings(database_url=f"sqlite+aiosqlite:///{tmp_path / 'test.db'}")
    )
    async with database.engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    yield database
    await database.dispose()


async def test_notice_upsert_is_idempotent_and_tracks_changes(database):
    notice = FakeNotice(
        external_id="notice-1", title="Primeiro edital", source_url="https://sinter.example/1",
        status="open", application_deadline="2026-10-01",
    )
    async with database.session() as session:
        repository = SinterRepository(session)
        first = await repository.upsert_notice(notice)
        second = await repository.upsert_notice(notice)
        assert first.created is True
        assert first.changed is True
        assert second.created is False
        assert second.changed is False

    async with database.session() as session:
        saved = await session.scalar(select(Opportunity).where(Opportunity.external_id == "notice-1"))
        assert saved is not None
        first_seen = saved.first_seen_at
        previous_updated = saved.updated_at

    changed = replace(notice, title="Edital revisado", record_hash="notice-hash-v2")
    async with database.session() as session:
        result = await SinterRepository(session).upsert_notice(changed)
        assert result.created is False
        assert result.changed is True

    async with database.session() as session:
        saved = await session.get(Opportunity, "notice-1")
        assert saved.title == "Edital revisado"
        assert saved.first_seen_at == first_seen
        assert saved.updated_at >= previous_updated


async def test_conflicting_upserts_do_not_duplicate_or_change_equal_content(database):
    notice = FakeNotice(
        external_id="same-notice", title="Edital", source_url="https://sinter.example/same"
    )
    async with database.session() as first:
        created = await SinterRepository(first).upsert_notice(notice)
        assert created.created is True

    async with database.session() as second:
        repeated = await SinterRepository(second).upsert_notice(notice)
        assert repeated.created is False
        assert repeated.changed is False

    async with database.session() as session:
        rows = (
            await session.scalars(
                select(Opportunity).where(Opportunity.external_id == "same-notice")
            )
        ).all()
        assert len(rows) == 1


async def test_agreement_upsert_maps_filter_fields(database):
    agreement = FakeAgreement(
        external_id="agreement-1", institution="Universidade Exemplo", continent="Europa",
        country="Portugal", source_url="https://sinter.example/a", subject_area="Engenharia",
    )
    async with database.session() as session:
        result = await SinterRepository(session).upsert_agreement(agreement)
        assert result.created is True

    async with database.session() as session:
        saved = await session.get(Institution, "agreement-1")
        assert saved.name == "Universidade Exemplo"
        assert saved.continent == "Europa"
        assert saved.country == "Portugal"
        assert saved.subject_area == "Engenharia"
        assert saved.exchange_available is None

"""Upserts idempotentes e seguros para concorrência dos registros SINTER."""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

from sqlalchemy import update
from sqlalchemy.dialects.postgresql import insert as postgresql_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import func

from viajaufsc_api.db.models import Institution, Opportunity

if TYPE_CHECKING:
    from sinter_collector.models import Agreement, Notice


@dataclass(frozen=True, slots=True)
class UpsertResult:
    """Resultado de uma gravação idempotente."""

    created: bool
    changed: bool


class SinterRepository:
    """Persiste registros sem a corrida típica de SELECT seguido de INSERT.

    A inserção ``ON CONFLICT DO NOTHING`` e a atualização condicional são
    operações atômicas na mesma transação. A atualização só ocorre quando o
    hash diverge, preservando ``first_seen_at`` e delegando ``updated_at`` ao
    relógio do banco.
    """

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def upsert_notice(self, notice: Notice) -> UpsertResult:
        values = {
            "title": notice.title,
            "source_url": notice.source_url,
            "canonical_url": notice.canonical_url,
            "content_hash": notice.record_hash,
            "kind": notice.kind,
            "status": notice.status,
            "program": notice.program,
            "link_text": notice.link_text,
            "audience": notice.audience,
            "application_deadline": notice.application_deadline,
            "deadline_text": notice.deadline_text,
            "body": notice.body,
            "published_at": notice.published_at,
            "modified_at": notice.modified_at,
        }
        return await self._upsert(Opportunity, notice.external_id, values)

    async def upsert_agreement(self, agreement: Agreement) -> UpsertResult:
        values = {
            "name": agreement.institution,
            "continent": agreement.continent,
            "country": agreement.country,
            "source_url": agreement.source_url,
            "canonical_url": agreement.canonical_url,
            "content_hash": agreement.record_hash,
            "details": agreement.details,
            "start_date": agreement.start_date,
            "end_date": agreement.end_date,
            "agreement_type": agreement.agreement_type,
            "subject_area": agreement.subject_area,
            "exchange_available": None,
        }
        return await self._upsert(Institution, agreement.external_id, values)

    def _insert(self, model: type[Opportunity] | type[Institution]) -> Any:
        dialect = self.session.get_bind().dialect.name
        if dialect == "postgresql":
            return postgresql_insert(model)
        if dialect == "sqlite":
            return sqlite_insert(model)
        raise NotImplementedError("SINTER upserts require PostgreSQL or SQLite.")

    async def _upsert(
        self,
        model: type[Opportunity] | type[Institution],
        external_id: str,
        values: dict[str, object],
    ) -> UpsertResult:
        inserted = await self.session.execute(
            self._insert(model)
            .values(external_id=external_id, **values)
            .on_conflict_do_nothing(index_elements=["external_id"])
        )
        if inserted.rowcount == 1:
            return UpsertResult(created=True, changed=True)

        # `func.now()` é emitido como SQL (NOW()/CURRENT_TIMESTAMP), evitando
        # que o relógio do processo seja a fonte de verdade para atualizações.
        changed = await self.session.execute(
            update(model)
            .where(
                model.external_id == external_id,
                model.content_hash != values["content_hash"],
            )
            .values(**values, updated_at=func.now())
        )
        return UpsertResult(created=False, changed=changed.rowcount == 1)

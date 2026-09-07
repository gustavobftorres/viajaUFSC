"""Upserts idempotentes e seguros para concorrência dos registros SINTER."""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

from sqlalchemy import Select, func, select, update
from sqlalchemy.dialects.postgresql import insert as postgresql_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.ext.asyncio import AsyncSession

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


@dataclass(frozen=True, slots=True)
class PageResult:
    """Uma página de registros e o total compatível com os filtros."""

    items: list[Opportunity] | list[Institution]
    total: int


class CatalogRepository:
    """Consultas assíncronas, paginadas e livres de detalhes HTTP."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_opportunities(
        self,
        *,
        page: int,
        page_size: int,
        status: str | None = None,
        deadline_from: str | None = None,
        deadline_to: str | None = None,
    ) -> PageResult:
        statement: Select[Any] = select(Opportunity)
        if status:
            statement = statement.where(func.lower(Opportunity.status) == status.lower())
        if deadline_from:
            statement = statement.where(Opportunity.application_deadline >= deadline_from)
        if deadline_to:
            statement = statement.where(Opportunity.application_deadline <= deadline_to)
        return await self._page(statement, Opportunity, page, page_size)

    async def get_opportunity(self, external_id: str) -> Opportunity | None:
        return await self.session.get(Opportunity, external_id)

    async def list_institutions(
        self,
        *,
        page: int,
        page_size: int,
        continent: str | None = None,
        country: str | None = None,
        subject_area: str | None = None,
        exchange_available: bool | None = None,
    ) -> PageResult:
        statement: Select[Any] = select(Institution)
        if continent:
            statement = statement.where(func.lower(Institution.continent) == continent.lower())
        if country:
            statement = statement.where(func.lower(Institution.country) == country.lower())
        if subject_area:
            statement = statement.where(
                func.lower(Institution.subject_area).contains(subject_area.lower())
            )
        if exchange_available is not None:
            statement = statement.where(Institution.exchange_available == exchange_available)
        return await self._page(statement, Institution, page, page_size)

    async def get_institution(self, external_id: str) -> Institution | None:
        return await self.session.get(Institution, external_id)

    async def _page(
        self,
        statement: Select[Any],
        model: type[Opportunity] | type[Institution],
        page: int,
        page_size: int,
    ) -> PageResult:
        total = await self.session.scalar(
            select(func.count()).select_from(statement.order_by(None).subquery())
        )
        ordered = statement.order_by(model.external_id).offset((page - 1) * page_size).limit(page_size)
        items = list((await self.session.scalars(ordered)).all())
        return PageResult(items=items, total=total or 0)

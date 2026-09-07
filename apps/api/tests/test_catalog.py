from __future__ import annotations

from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from viajaufsc_api.config import Settings
from viajaufsc_api.db.database import create_database
from viajaufsc_api.db.models import Base, Institution, Opportunity
from viajaufsc_api.main import create_app


@pytest.fixture
async def seeded_settings(tmp_path):
    settings = Settings(database_url=f"sqlite+aiosqlite:///{tmp_path / 'catalog.db'}")
    database = create_database(settings)
    now = datetime.now(timezone.utc)
    async with database.engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    async with database.session() as session:
        session.add_all(
            [
                Opportunity(
                    external_id="notice-open", title="Mobilidade aberta", source_url="https://example.test/open",
                    content_hash="a" * 64, status="open", application_deadline="2026-10-01",
                    first_seen_at=now, updated_at=now,
                ),
                Opportunity(
                    external_id="notice-closed", title="Mobilidade encerrada", source_url="https://example.test/closed",
                    content_hash="b" * 64, status="closed", application_deadline="2026-01-01",
                    first_seen_at=now, updated_at=now,
                ),
                Opportunity(
                    external_id="notice-future", title="Mobilidade futura", source_url="https://example.test/future",
                    content_hash="e" * 64, status="open", application_deadline="2026-12-01",
                    first_seen_at=now, updated_at=now,
                ),
                Institution(
                    external_id="inst-pt", name="Universidade de Lisboa", continent="Europa", country="Portugal",
                    source_url="https://example.test/pt", content_hash="c" * 64, subject_area="Engenharia Civil",
                    exchange_available=True, first_seen_at=now, updated_at=now,
                ),
                Institution(
                    external_id="inst-ar", name="Universidad Nacional", continent="América do Sul", country="Argentina",
                    source_url="https://example.test/ar", content_hash="d" * 64, subject_area="Medicina",
                    exchange_available=False, first_seen_at=now, updated_at=now,
                ),
            ]
        )
    await database.dispose()
    return settings


def test_opportunities_are_paginated_and_filterable(seeded_settings):
    with TestClient(create_app(seeded_settings)) as client:
        response = client.get(
            "/api/v1/opportunities",
            params={"status": "OPEN", "deadline_from": "2026-09-01", "deadline_to": "2026-10-01"},
        )

    assert response.status_code == 200
    assert response.json() == {
        "items": [
            {
                "external_id": "notice-open", "title": "Mobilidade aberta", "kind": None, "status": "open",
                "program": None, "link_text": None, "audience": None, "application_deadline": "2026-10-01",
                "deadline_text": None, "body": None, "published_at": None, "modified_at": None,
                "source_url": "https://example.test/open", "canonical_url": None,
                "first_seen_at": response.json()["items"][0]["first_seen_at"],
                "updated_at": response.json()["items"][0]["updated_at"],
            }
        ], "page": 1, "page_size": 20, "total": 1,
    }


def test_opportunity_detail_pagination_and_validation(seeded_settings):
    with TestClient(create_app(seeded_settings)) as client:
        detail = client.get("/api/v1/opportunities/notice-open")
        missing = client.get("/api/v1/opportunities/missing")
        second_page = client.get("/api/v1/opportunities", params={"page": 2, "page_size": 2})
        invalid_page = client.get("/api/v1/opportunities", params={"page": 0})
        invalid_size = client.get("/api/v1/opportunities", params={"page_size": 101})
        invalid_date = client.get("/api/v1/opportunities", params={"deadline_from": "tomorrow"})

    assert detail.status_code == 200
    assert detail.json()["external_id"] == "notice-open"
    assert missing.status_code == 404
    assert missing.json()["error"] == {"code": "http_error", "message": "Opportunity not found."}
    assert second_page.status_code == 200
    assert second_page.json()["total"] == 3
    assert [item["external_id"] for item in second_page.json()["items"]] == ["notice-open"]
    for response in (invalid_page, invalid_size, invalid_date):
        assert response.status_code == 422
        assert response.json()["error"]["code"] == "validation_error"


def test_institutions_filters_details_and_standard_errors(seeded_settings):
    with TestClient(create_app(seeded_settings)) as client:
        listed = client.get("/api/v1/institutions", params={"continent": "europa", "subject_area": "engenharia", "exchange_available": "true"})
        detail = client.get("/api/v1/institutions/inst-pt")
        missing = client.get("/api/v1/institutions/missing")
        argentina = client.get("/api/v1/institutions", params={"country": "argentina", "exchange_available": "false"})

    assert listed.status_code == 200
    assert listed.json()["total"] == 1
    assert listed.json()["items"][0]["external_id"] == "inst-pt"
    assert detail.status_code == 200
    assert detail.json()["country"] == "Portugal"
    assert missing.status_code == 404
    assert missing.json()["error"] == {"code": "http_error", "message": "Institution not found."}
    assert argentina.status_code == 200
    assert argentina.json()["items"][0]["external_id"] == "inst-ar"


def test_catalog_is_unavailable_without_database_configuration():
    with TestClient(create_app(Settings(database_url=None))) as client:
        collection_response = client.get("/api/v1/opportunities")
        detail_response = client.get("/api/v1/institutions/inst-pt")

    for response in (collection_response, detail_response):
        assert response.status_code == 503
        assert response.json()["error"] == {"code": "http_error", "message": "Database is not configured."}


def test_openapi_documents_catalog_operations(seeded_settings):
    with TestClient(create_app(seeded_settings)) as client:
        schema = client.get("/api/v1/openapi.json").json()

    assert "/api/v1/opportunities" in schema["paths"]
    assert {parameter["name"] for parameter in schema["paths"]["/api/v1/institutions"]["get"]["parameters"]} >= {
        "continent", "country", "subject_area", "exchange_available", "page", "page_size"
    }

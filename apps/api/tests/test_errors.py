from fastapi import FastAPI
from fastapi.testclient import TestClient

from viajaufsc_api.config import Settings
from viajaufsc_api.main import create_app


def test_unknown_route_uses_consistent_error_envelope() -> None:
    app = create_app(Settings(_env_file=None))

    with TestClient(app) as client:
        response = client.get("/api/v1/does-not-exist")

    assert response.status_code == 404
    assert response.json() == {
        "error": {"code": "http_error", "message": "Not Found"}
    }


def test_validation_errors_use_consistent_error_envelope() -> None:
    app = create_app(Settings(_env_file=None))

    @app.get("/api/v1/echo")
    async def echo(page: int) -> dict[str, int]:
        return {"page": page}

    with TestClient(app) as client:
        response = client.get("/api/v1/echo?page=invalid")

    assert response.status_code == 422
    body = response.json()
    assert body["error"]["code"] == "validation_error"
    assert body["error"]["details"][0]["loc"] == ["query", "page"]

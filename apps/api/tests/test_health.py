from fastapi.testclient import TestClient

from viajaufsc_api.config import Settings
from viajaufsc_api.main import create_app


def test_health_check_is_versioned_and_documented() -> None:
    app = create_app(Settings(_env_file=None))

    with TestClient(app) as client:
        response = client.get("/api/v1/health")
        schema = client.get("/api/v1/openapi.json")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert "/api/v1/health" in schema.json()["paths"]

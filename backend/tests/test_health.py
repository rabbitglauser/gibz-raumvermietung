from fastapi.testclient import TestClient

from app.config import settings
from app.main import app


def test_health_endpoint_returns_ok_status():
    with TestClient(app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": settings.app_name}


def test_root_endpoint_returns_running_message():
    with TestClient(app) as client:
        response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {"message": "Backend is running"}


def test_health_endpoint_runs_lifespan_db_ping():
    # The TestClient context manager triggers FastAPI's lifespan, which calls
    # ping_db() and stores the result on app.state. The stub in conftest
    # returns True, so we expect db_ok to be set after startup.
    with TestClient(app) as client:
        client.get("/health")
        assert app.state.db_ok is True

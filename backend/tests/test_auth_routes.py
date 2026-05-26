from datetime import datetime, timezone
import asyncio
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.db import get_database
from app.main import app
from app.services.auth_service import hash_password, seed_demo_staff_user

from .mocks import MockUsersCollection


@pytest.fixture
def users_collection() -> MockUsersCollection:
    return MockUsersCollection(
        seed=[
            {
                "_id": "user-1",
                "username": "secretariat",
                "password_hash": hash_password("correct-password"),
                "role": "staff",
                "name": "Secretariat User",
                "email": "secretariat@example.com",
                "created_at": datetime.now(timezone.utc),
            }
        ]
    )


@pytest.fixture
def client(users_collection):
    app.dependency_overrides[get_database] = lambda: SimpleNamespace(
        users=users_collection
    )
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


def test_login_sets_http_only_staff_cookie(client):
    response = client.post(
        "/auth/login",
        json={"username": "secretariat", "password": "correct-password"},
    )

    assert response.status_code == 200
    assert response.json()["username"] == "secretariat"
    assert settings.auth_cookie_name in response.cookies
    assert "httponly" in response.headers["set-cookie"].lower()


def test_login_rejects_invalid_password(client):
    response = client.post(
        "/auth/login",
        json={"username": "secretariat", "password": "wrong-password"},
    )

    assert response.status_code == 401


def test_me_returns_current_staff_from_cookie(client):
    login_response = client.post(
        "/auth/login",
        json={"username": "secretariat", "password": "correct-password"},
    )
    assert login_response.status_code == 200

    response = client.get("/auth/me")

    assert response.status_code == 200
    assert response.json() == {"username": "secretariat", "role": "staff"}


def test_logout_clears_staff_cookie(client):
    response = client.post("/auth/logout")

    assert response.status_code == 200
    assert settings.auth_cookie_name in response.headers["set-cookie"]
    assert "max-age=0" in response.headers["set-cookie"].lower()


def test_seed_demo_staff_user_creates_user_when_enabled(monkeypatch):
    users = MockUsersCollection()
    monkeypatch.setattr(settings, "seed_staff_enabled", True)
    monkeypatch.setattr(settings, "seed_staff_username", "demo")
    monkeypatch.setattr(settings, "seed_staff_password", "demo-password")
    monkeypatch.setattr(settings, "seed_staff_name", "Demo User")
    monkeypatch.setattr(settings, "seed_staff_email", "demo@example.com")

    created = asyncio.run(seed_demo_staff_user(SimpleNamespace(users=users)))

    assert created is True
    assert users.documents[0]["username"] == "demo"
    assert users.documents[0]["role"] == "staff"


def test_seed_demo_staff_user_skips_when_disabled(monkeypatch):
    users = MockUsersCollection()
    monkeypatch.setattr(settings, "seed_staff_enabled", False)

    created = asyncio.run(seed_demo_staff_user(SimpleNamespace(users=users)))

    assert created is False
    assert users.documents == []

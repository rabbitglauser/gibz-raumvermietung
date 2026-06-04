from datetime import datetime, timezone
import asyncio
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.db import get_database
from app.main import app
from app.services.auth_service import create_auth_token, hash_password, seed_demo_staff_user

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


def set_cookie(client, role: str = "staff") -> None:
    token = create_auth_token("test-user", role)
    client.cookies.set(settings.auth_cookie_name, token)


def test_secretariat_role_can_login(users_collection, monkeypatch):
    """A user with role=secretariat gets a valid token that require_staff accepts."""
    from app.services.auth_service import create_auth_token, decode_auth_token
    token = create_auth_token("sec-user", "secretariat")
    principal = decode_auth_token(token)
    assert principal.role == "secretariat"
    assert principal.username == "sec-user"


def test_hausdienst_role_accepted_by_require_staff():
    from app.services.auth_service import create_auth_token, decode_auth_token
    token = create_auth_token("hd-user", "hausdienst")
    principal = decode_auth_token(token)
    assert principal.role == "hausdienst"


def test_restaurant_treff_role_accepted_by_require_staff():
    from app.services.auth_service import create_auth_token, decode_auth_token
    token = create_auth_token("rt-user", "restaurant_treff")
    principal = decode_auth_token(token)
    assert principal.role == "restaurant_treff"


def test_list_users_requires_admin(client):
    set_cookie(client, role="staff")
    response = client.get("/auth/users")
    assert response.status_code == 403


def test_list_users_requires_auth(client):
    response = client.get("/auth/users")
    assert response.status_code == 401


def test_list_users_returns_all_for_admin(client):
    set_cookie(client, role="admin")
    response = client.get("/auth/users")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["username"] == "secretariat"


def test_create_staff_user_requires_admin(client):
    set_cookie(client, role="staff")
    response = client.post(
        "/auth/users",
        json={
            "username": "new-user",
            "password": "SecurePass123!",
            "role": "hausdienst",
            "name": "Hausdienst User",
            "email": "hausdienst@gibz.ch",
        },
    )
    assert response.status_code == 403


def test_create_staff_user_as_admin(client):
    set_cookie(client, role="admin")
    response = client.post(
        "/auth/users",
        json={
            "username": "new-hausdienst",
            "password": "SecurePass123!",
            "role": "hausdienst",
            "name": "Hausdienst User",
            "email": "hausdienst@gibz.ch",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "new-hausdienst"
    assert data["role"] == "hausdienst"


def test_create_staff_user_duplicate_username(client):
    set_cookie(client, role="admin")
    response = client.post(
        "/auth/users",
        json={
            "username": "secretariat",
            "password": "SecurePass123!",
            "role": "secretariat",
            "name": "Another Secretariat",
            "email": "sec2@gibz.ch",
        },
    )
    assert response.status_code == 409

"""Staff authentication and authorization tests.

Staff log in with username/password and receive a JWT in an HTTP-only
cookie. Authenticated staff may manage reservations; anonymous requests get
401; routes restricted to admin (deletion / "higher authority override")
return 403 for non-admin staff.
"""

import sys
from types import ModuleType, SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

fake_db_module = ModuleType("app.db")
fake_db_module.db = SimpleNamespace()
fake_db_module.ping_db = AsyncMock(return_value=True)
fake_db_module.get_database = lambda: fake_db_module.db
sys.modules.setdefault("app.db", fake_db_module)

from app.db import get_database  # noqa: E402
from app.routers.auth import router as auth_router  # noqa: E402
from app.routers.reservations import router as reservations_router  # noqa: E402
from app.security import hash_password  # noqa: E402

from .mocks import MockReservationsCollection, MockUsersCollection  # noqa: E402

app = FastAPI()
app.include_router(auth_router)
app.include_router(reservations_router)


def _seed_users() -> MockUsersCollection:
    return MockUsersCollection(
        seed=[
            {
                "_id": "user-admin",
                "username": "admin",
                "password_hash": hash_password("admin-secret"),
                "role": "admin",
                "name": "Admin",
                "email": "admin@gibz.ch",
            },
            {
                "_id": "user-sekr",
                "username": "sekretariat",
                "password_hash": hash_password("sekr-secret"),
                "role": "secretariat",
                "name": "Sekretariat",
                "email": "sekr@gibz.ch",
            },
        ]
    )


@pytest.fixture
def fake_db():
    return SimpleNamespace(
        reservations=MockReservationsCollection(),
        users=_seed_users(),
    )


@pytest.fixture
def client(fake_db):
    app.dependency_overrides[get_database] = lambda: fake_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


def _login(client: TestClient, username: str, password: str):
    return client.post(
        "/auth/login", json={"username": username, "password": password}
    )


def test_login_with_valid_credentials_sets_cookie(client):
    response = _login(client, "admin", "admin-secret")
    assert response.status_code == 200
    assert response.json()["username"] == "admin"
    assert "rr_session" in response.cookies


def test_login_with_bad_password_is_rejected(client):
    response = _login(client, "admin", "wrong")
    assert response.status_code == 401


def test_unauthenticated_request_to_staff_route_is_rejected(client):
    response = client.get("/reservations")
    assert response.status_code == 401


def test_authenticated_staff_can_list_reservations(client):
    assert _login(client, "sekretariat", "sekr-secret").status_code == 200
    response = client.get("/reservations")
    assert response.status_code == 200
    assert response.json()["items"] == []


def test_me_returns_current_user(client):
    _login(client, "admin", "admin-secret")
    response = client.get("/auth/me")
    assert response.status_code == 200
    assert response.json()["role"] == "admin"


def test_non_admin_cannot_delete_reservation(client):
    # Non-admin staff are authenticated (not 401) but lack permission (403).
    _login(client, "sekretariat", "sekr-secret")
    response = client.delete("/reservations/some-id")
    assert response.status_code == 403


def test_admin_token_can_delete_reservation(client, fake_db):
    fake_db.reservations.documents.append({"_id": "res-1", "event_name": "X"})
    _login(client, "admin", "admin-secret")
    response = client.delete("/reservations/res-1")
    assert response.status_code == 204


def test_logout_clears_session(client):
    _login(client, "admin", "admin-secret")
    assert client.get("/auth/me").status_code == 200
    client.post("/auth/logout")
    # TestClient persists cookies; delete_cookie expires it so /me now 401s.
    assert client.get("/auth/me").status_code == 401

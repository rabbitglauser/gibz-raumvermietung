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
from app.routers.rooms import router as rooms_router  # noqa: E402

from .mocks import MockRoomsCollection  # noqa: E402


SEED_ROOMS = [
    {
        "room_id": "seminarraum-5-003-004",
        "capacity": 36,
        "seating_types": ["seminar", "block", "u_shape", "exam"],
        "equipment": ["projector", "flipchart", "pinboard", "visualizer", "whiteboard"],
        "microphone": False,
        "technical_support": False,
    },
    {
        "room_id": "aula-1-005",
        "capacity": 250,
        "seating_types": ["theater", "banquet", "exam", "block"],
        "equipment": [
            "projector",
            "flipchart",
            "pinboard",
            "whiteboard",
            "laptop",
            "lectern",
            "stage",
        ],
        "microphone": True,
        "technical_support": True,
    },
]


app = FastAPI()
app.include_router(rooms_router)


@pytest.fixture
def rooms_collection() -> MockRoomsCollection:
    return MockRoomsCollection(seed=SEED_ROOMS)


@pytest.fixture
def client(rooms_collection):
    fake_db = SimpleNamespace(rooms=rooms_collection)
    app.dependency_overrides[get_database] = lambda: fake_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


def test_list_rooms_returns_seeded_rooms(client):
    response = client.get("/rooms")

    assert response.status_code == 200
    body = response.json()
    assert "items" in body
    assert len(body["items"]) == 2
    room_ids = {item["room_id"] for item in body["items"]}
    assert room_ids == {"seminarraum-5-003-004", "aula-1-005"}


def test_get_room_by_id_returns_room(client):
    response = client.get("/rooms/aula-1-005")

    assert response.status_code == 200
    body = response.json()
    assert body["room_id"] == "aula-1-005"
    assert body["capacity"] == 250
    assert body["microphone"] is True
    assert "stage" in body["equipment"]


def test_get_room_by_id_returns_404_for_missing(client):
    response = client.get("/rooms/seminarraum-2-112")

    assert response.status_code == 404

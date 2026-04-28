"""Shared test setup.

Stubs `app.db` before any test module imports the FastAPI app so the real
AsyncMongoClient is never instantiated. Individual tests can still
monkeypatch `db` on the imported router for collection-level fakes
(see test_reservations.py).
"""

import sys
from types import ModuleType, SimpleNamespace
from unittest.mock import AsyncMock

if "app.db" not in sys.modules:
    fake_db_module = ModuleType("app.db")
    fake_db_module.db = SimpleNamespace()
    fake_db_module.ping_db = AsyncMock(return_value=True)
    sys.modules["app.db"] = fake_db_module

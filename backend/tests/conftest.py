"""Shared test setup.

Stubs `app.db` before any test module imports the FastAPI app so the real
AsyncMongoClient is never instantiated. Individual tests inject fake
collections via FastAPI dependency overrides on `get_database`.
"""

import sys
from types import ModuleType, SimpleNamespace
from unittest.mock import AsyncMock

if "app.db" not in sys.modules:
    fake_db_module = ModuleType("app.db")
    fake_db_module.db = SimpleNamespace()
    fake_db_module.ping_db = AsyncMock(return_value=True)
    fake_db_module.get_database = lambda: fake_db_module.db
    sys.modules["app.db"] = fake_db_module

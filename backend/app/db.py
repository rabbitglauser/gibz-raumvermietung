from pymongo import AsyncMongoClient

from .config import settings

client = AsyncMongoClient(settings.mongodb_url)
db = client[settings.mongodb_db]


def get_database():
    """FastAPI dependency that returns the shared Mongo database object.

    Use this — not the module-level `db` — so tests can override the
    dependency to inject a fake database.
    """
    return db


async def ping_db() -> bool:
    try:
        await client.admin.command("ping")
        return True
    except Exception:
        return False

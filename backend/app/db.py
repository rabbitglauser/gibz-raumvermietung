from pymongo import AsyncMongoClient
from .config import settings

client = AsyncMongoClient(settings.mongodb_url)
db = client[settings.mongodb_db]


async def ping_db() -> bool:
    try:
        await client.admin.command("ping")
        return True
    except Exception:
        return False
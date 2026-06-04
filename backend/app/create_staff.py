"""Create a staff account from the command line.

There is no self-registration for staff. Run this against a reachable
MongoDB (locally or `docker compose exec backend ...`):

    python -m app.create_staff --username admin --password secret \
        --name "Admin" --email admin@gibz.ch --role admin

Roles: staff, secretariat, hausdienst, restaurant_treff, admin.
"""

import argparse
import asyncio

from .config import settings
from .dao.user_dao import UserDAO
from .db import db
from .models.enums import UserRole
from .services.user_service import UserService


async def _create(args: argparse.Namespace) -> None:
    dao = UserDAO(db)
    existing = await dao.get_by_username(args.username)
    if existing is not None:
        print(f"User '{args.username}' already exists — skipping.")
        return

    service = UserService(dao)
    created = await service.create_staff(
        username=args.username,
        password=args.password,
        name=args.name,
        email=args.email,
        role=UserRole(args.role),
    )
    print(
        f"Created staff user '{created['username']}' "
        f"(role={created['role']}) in database '{settings.mongodb_db}'."
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Create a GIBZ staff account")
    parser.add_argument("--username", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--name", required=True)
    parser.add_argument("--email", required=True)
    parser.add_argument(
        "--role",
        default=UserRole.staff.value,
        choices=[role.value for role in UserRole],
    )
    args = parser.parse_args()
    asyncio.run(_create(args))


if __name__ == "__main__":
    main()

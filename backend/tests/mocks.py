"""In-memory fakes for the Mongo collections used by the DAO layer.

These let tests exercise the full router → service → DAO path without
touching a real MongoDB. The query interpreter supports the operators and
dotted-path lookups actually used by our DAO queries — extend
`matches_operator` / `resolve_path` when a new one is introduced.
"""

import re
from types import SimpleNamespace
from unittest.mock import AsyncMock


class AsyncCursor:
    def __init__(self, documents: list[dict]):
        self.documents = documents

    def sort(self, field: str, direction: int) -> "AsyncCursor":
        self.documents = sorted(
            self.documents,
            key=lambda item: resolve_path(item, field),
            reverse=direction < 0,
        )
        return self

    def __aiter__(self):
        return self._iterator()

    async def _iterator(self):
        for document in self.documents:
            yield document


class _BaseCollection:
    """Shared in-memory collection behaviour."""

    def __init__(self):
        self.documents: list[dict] = []
        self.insert_one = AsyncMock(side_effect=self._insert_one)
        self.find_one = AsyncMock(side_effect=self._find_one)
        self.update_one = AsyncMock(side_effect=self._update_one)
        self.delete_one = AsyncMock(side_effect=self._delete_one)

    def _new_id(self, doc: dict) -> str:
        raise NotImplementedError

    def _insert_one(self, doc: dict) -> SimpleNamespace:
        inserted_id = self._new_id(doc)
        self.documents.append({**doc, "_id": inserted_id})
        return SimpleNamespace(inserted_id=inserted_id)

    def _find_one(self, query: dict) -> dict | None:
        return next((doc for doc in self.documents if matches_query(doc, query)), None)

    def _update_one(self, query: dict, update: dict) -> SimpleNamespace:
        match = self._find_one(query)

        if match is not None and "$set" in update:
            for key, value in update["$set"].items():
                _assign_path(match, key, value)

        return SimpleNamespace(modified_count=1 if match else 0)

    def _delete_one(self, query: dict) -> SimpleNamespace:
        match = self._find_one(query)

        if match is not None:
            self.documents.remove(match)
            return SimpleNamespace(deleted_count=1)

        return SimpleNamespace(deleted_count=0)

    def find(self, query: dict | None = None) -> AsyncCursor:
        docs = (
            list(self.documents)
            if not query
            else [doc for doc in self.documents if matches_query(doc, query)]
        )

        return AsyncCursor(docs)


class MockReservationsCollection(_BaseCollection):
    def __init__(self):
        super().__init__()
        self.next_id = 1

    def _new_id(self, doc: dict) -> str:
        inserted_id = f"reservation-{self.next_id}"
        self.next_id += 1
        return inserted_id


class MockRoomsCollection(_BaseCollection):
    def __init__(self, seed: list[dict] | None = None):
        super().__init__()

        if seed:
            for doc in seed:
                self.documents.append({**doc, "_id": doc.get("room_id")})

    def _new_id(self, doc: dict) -> str:
        return doc.get("room_id") or f"room-{len(self.documents) + 1}"


class MockUsersCollection(_BaseCollection):
    def __init__(self, seed: list[dict] | None = None):
        super().__init__()
        self.next_id = 1

        if seed:
            for doc in seed:
                self.documents.append({**doc, "_id": doc.get("_id") or self._new_id(doc)})

    def _new_id(self, doc: dict) -> str:
        inserted_id = doc.get("_id") or f"user-{self.next_id}"
        self.next_id += 1
        return inserted_id


def resolve_path(doc: dict, path: str):
    """Resolve a possibly-dotted field path, for example ``catering.needed``."""
    current = doc

    for part in path.split("."):
        if not isinstance(current, dict):
            return None

        current = current.get(part)

    return current


def _assign_path(doc: dict, path: str, value) -> None:
    parts = path.split(".")
    current = doc

    for part in parts[:-1]:
        current = current.setdefault(part, {})

    current[parts[-1]] = value


def matches_query(doc: dict, query: dict) -> bool:
    for field, expected in query.items():
        if field == "$or":
            if not any(matches_query(doc, sub_query) for sub_query in expected):
                return False
            continue

        if not matches_condition(resolve_path(doc, field), expected):
            return False

    return True


def matches_condition(actual: object, expected: object) -> bool:
    if not isinstance(expected, dict):
        return actual == expected

    return all(
        matches_operator(actual, operator, value)
        for operator, value in expected.items()
        if operator != "$options"
    )


def matches_operator(actual: object, operator: str, expected: object) -> bool:
    if operator == "$nin":
        return actual not in expected

    if operator == "$in":
        return actual in expected

    if operator == "$lt":
        return actual is not None and actual < expected

    if operator == "$lte":
        return actual is not None and actual <= expected

    if operator == "$gt":
        return actual is not None and actual > expected

    if operator == "$gte":
        return actual is not None and actual >= expected

    if operator == "$eq":
        return actual == expected

    if operator == "$ne":
        return actual != expected

    if operator == "$regex":
        if actual is None:
            return False

        flags = re.IGNORECASE
        return re.search(str(expected), str(actual), flags) is not None

    raise AssertionError(f"Unsupported fake Mongo operator: {operator}")
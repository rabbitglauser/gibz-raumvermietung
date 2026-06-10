"""In-memory fakes for the Mongo collections used by the DAO layer.

These let tests exercise the full router → service → DAO path without
touching a real MongoDB. The query interpreter only supports the
operators actually used by our DAO queries — extend `matches_operator`
when a new one is introduced.
"""

from types import SimpleNamespace
from unittest.mock import AsyncMock


class AsyncCursor:
    def __init__(self, documents: list[dict]):
        self.documents = documents

    def sort(self, field: str, direction: int) -> "AsyncCursor":
        self.documents = sorted(
            self.documents,
            key=lambda item: get_nested_value(item, field),
            reverse=direction < 0,
        )
        return self

    def __aiter__(self):
        return self._iterator()

    async def _iterator(self):
        for document in self.documents:
            yield document


class MockReservationsCollection:
    def __init__(self):
        self.documents: list[dict] = []
        self.next_id = 1
        self.insert_one = AsyncMock(side_effect=self._insert_one)
        self.find_one = AsyncMock(side_effect=self._find_one)
        self.update_one = AsyncMock(side_effect=self._update_one)

    def _insert_one(self, doc: dict) -> SimpleNamespace:
        inserted_id = f"reservation-{self.next_id}"
        self.next_id += 1
        self.documents.append({**doc, "_id": inserted_id})
        return SimpleNamespace(inserted_id=inserted_id)

    def _find_one(self, query: dict) -> dict | None:
        if "_id" in query and len(query) == 1:
            return next(
                (doc for doc in self.documents if doc["_id"] == query["_id"]),
                None,
            )
        return next((doc for doc in self.documents if matches_query(doc, query)), None)

    def _update_one(self, query: dict, update: dict) -> SimpleNamespace:
        match = self._find_one(query)
        if match is not None and "$set" in update:
            match.update(update["$set"])
        return SimpleNamespace(modified_count=1 if match else 0)

    def find(self, query: dict | None = None) -> AsyncCursor:
        docs = (
            list(self.documents)
            if not query
            else [doc for doc in self.documents if matches_query(doc, query)]
        )
        return AsyncCursor(docs)


class MockRoomsCollection:
    def __init__(self, seed: list[dict] | None = None):
        self.documents: list[dict] = list(seed) if seed else []
        self.insert_one = AsyncMock(side_effect=self._insert_one)
        self.find_one = AsyncMock(side_effect=self._find_one)
        self.update_one = AsyncMock(side_effect=self._update_one)

    def _insert_one(self, doc: dict) -> SimpleNamespace:
        inserted_id = doc.get("room_id") or f"room-{len(self.documents) + 1}"
        self.documents.append({**doc, "_id": inserted_id})
        return SimpleNamespace(inserted_id=inserted_id)

    def _find_one(self, query: dict) -> dict | None:
        return next((doc for doc in self.documents if matches_query(doc, query)), None)

    def _update_one(self, query: dict, update: dict) -> SimpleNamespace:
        match = self._find_one(query)
        if match is not None and "$set" in update:
            match.update(update["$set"])
        return SimpleNamespace(modified_count=1 if match else 0)

    def find(self, query: dict | None = None) -> AsyncCursor:
        docs = (
            list(self.documents)
            if not query
            else [doc for doc in self.documents if matches_query(doc, query)]
        )
        return AsyncCursor(docs)


class MockReminderLogCollection:
    def __init__(self):
        self.documents: list[dict] = []
        self.insert_one = AsyncMock(side_effect=self._insert_one)

    def _insert_one(self, doc: dict) -> SimpleNamespace:
        self.documents.append(dict(doc))
        return SimpleNamespace(inserted_id=None)

    def find(self, query: dict | None = None) -> AsyncCursor:
        docs = (
            list(self.documents)
            if not query
            else [doc for doc in self.documents if matches_query(doc, query)]
        )
        return AsyncCursor(docs)


class MockUsersCollection:
    def __init__(self, seed: list[dict] | None = None):
        self.documents: list[dict] = list(seed) if seed else []
        self.next_id = 1
        self.insert_one = AsyncMock(side_effect=self._insert_one)
        self.find_one = AsyncMock(side_effect=self._find_one)

    def _insert_one(self, doc: dict) -> SimpleNamespace:
        inserted_id = doc.get("_id") or f"user-{self.next_id}"
        self.next_id += 1
        self.documents.append({**doc, "_id": inserted_id})
        return SimpleNamespace(inserted_id=inserted_id)

    def _find_one(self, query: dict) -> dict | None:
        return next((doc for doc in self.documents if matches_query(doc, query)), None)

    def find(self, query: dict | None = None) -> AsyncCursor:
        docs = (
            list(self.documents)
            if not query
            else [doc for doc in self.documents if matches_query(doc, query)]
        )
        return AsyncCursor(docs)


def get_nested_value(doc: dict, field: str) -> object:
    current: object = doc
    for part in field.split("."):
        if not isinstance(current, dict):
            return None
        current = current.get(part)
    return current


def matches_query(doc: dict, query: dict) -> bool:
    return all(
        matches_condition(get_nested_value(doc, field), expected)
        for field, expected in query.items()
    )


def matches_condition(actual: object, expected: object) -> bool:
    if not isinstance(expected, dict):
        return actual == expected
    return all(matches_operator(actual, operator, value) for operator, value in expected.items())


def matches_operator(actual: object, operator: str, expected: object) -> bool:
    if operator == "$nin":
        return actual not in expected
    if operator == "$lt":
        return actual < expected
    if operator == "$gt":
        return actual > expected
    if operator == "$lte":
        return actual <= expected
    if operator == "$gte":
        return actual >= expected
    if operator == "$eq":
        return actual == expected
    if operator == "$ne":
        return actual != expected
    raise AssertionError(f"Unsupported fake Mongo operator: {operator}")

"""Edit deadline tests.

The PUT/PATCH /reservations/{id} route is not implemented yet, so these
tests are skipped at the module level. When the edit endpoint and its
deadline rule (e.g. "edits forbidden within N hours of start_time") are
added, remove the `pytestmark` and fill in the bodies.
"""

import pytest

pytestmark = pytest.mark.skip(
    reason="Edit reservation route not implemented yet — activate once "
    "PUT/PATCH /reservations/{id} and the deadline rule exist."
)


def test_edit_before_deadline_succeeds():
    """Editing a reservation before the deadline cutoff should return 200."""
    raise NotImplementedError


def test_edit_after_deadline_is_rejected():
    """Editing a reservation past the deadline should return 403/409."""
    raise NotImplementedError


def test_edit_deadline_uses_event_start_time():
    """The deadline must be computed from the reservation's start_time, not now."""
    raise NotImplementedError

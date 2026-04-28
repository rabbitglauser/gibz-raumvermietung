"""Staff-protected route tests.

No authentication layer exists in the current backend — every route is
public. These tests are skipped at the module level until staff auth
(e.g. an `Authorization` dependency on confirm/reject endpoints) lands.
When it does, remove `pytestmark` and replace the placeholders with real
TestClient calls.
"""

import pytest

pytestmark = pytest.mark.skip(
    reason="Staff auth not implemented yet — activate once a staff "
    "dependency (e.g. require_staff) and protected endpoints exist."
)


def test_unauthenticated_request_to_staff_route_is_rejected():
    """Anonymous requests to a staff-only route should return 401."""
    raise NotImplementedError


def test_non_staff_token_is_rejected():
    """A valid but non-staff token should return 403."""
    raise NotImplementedError


def test_staff_token_can_confirm_reservation():
    """A staff token should be able to transition pending → confirmed."""
    raise NotImplementedError


def test_staff_token_can_reject_reservation():
    """A staff token should be able to transition pending → rejected."""
    raise NotImplementedError

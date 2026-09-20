import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.models.user import User
from app.api.dependencies import get_current_user, get_db


@pytest.fixture
def auth_client(db_session: Session) -> TestClient:
    """Client with real un-overridden authentication logic."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides.pop(get_current_user, None)
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def test_get_profile_authenticated(auth_client: TestClient):
    auth_client.post(
        "/api/v1/auth/register",
        json={"email": "alice@example.com", "password": "Password123!", "full_name": "Alice Wonderland"}
    )
    res = auth_client.get("/api/v1/profile")
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["email"] == "alice@example.com"
    assert data["full_name"] == "Alice Wonderland"
    assert data["timezone_mode"] == "auto"
    assert data["theme_preference"] == "system"
    assert "hashed_password" not in data
    assert "password" not in data


def test_get_profile_unauthorized(auth_client: TestClient):
    auth_client.cookies.clear()
    res = auth_client.get("/api/v1/profile")
    assert res.status_code == status.HTTP_401_UNAUTHORIZED


def test_update_profile_full_name(auth_client: TestClient):
    auth_client.post(
        "/api/v1/auth/register",
        json={"email": "bob@example.com", "password": "Password123!", "full_name": "Bob Original"}
    )
    # Valid update with whitespace trimming
    res = auth_client.put("/api/v1/profile", json={"full_name": "  Bob The Builder  "})
    assert res.status_code == status.HTTP_200_OK
    assert res.json()["full_name"] == "Bob The Builder"

    # Validation: empty string
    res_empty = auth_client.put("/api/v1/profile", json={"full_name": ""})
    assert res_empty.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT

    # Validation: whitespace only
    res_ws = auth_client.put("/api/v1/profile", json={"full_name": "   "})
    assert res_ws.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT

    # Validation: too short (< 2 chars)
    res_short = auth_client.put("/api/v1/profile", json={"full_name": "A"})
    assert res_short.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT

    # Validation: too long (> 100 chars)
    res_long = auth_client.put("/api/v1/profile", json={"full_name": "A" * 101})
    assert res_long.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


def test_update_profile_timezone_iana_validation(auth_client: TestClient):
    auth_client.post(
        "/api/v1/auth/register",
        json={"email": "tzuser@example.com", "password": "Password123!", "full_name": "TZ User"}
    )

    # Valid IANA zones
    for valid_tz in ["America/New_York", "Europe/London", "Asia/Tokyo", "UTC"]:
        res = auth_client.put("/api/v1/profile", json={"timezone": valid_tz})
        assert res.status_code == status.HTTP_200_OK
        assert res.json()["timezone"] == valid_tz

    # Invalid timezones rejected with 422
    for invalid_tz in ["Mars/Phobos", "Invalid/Timezone", "GMT+25", "NonExistent/Zone"]:
        res = auth_client.put("/api/v1/profile", json={"timezone": invalid_tz})
        assert res.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


def test_update_profile_timezone_mode(auth_client: TestClient):
    auth_client.post(
        "/api/v1/auth/register",
        json={"email": "tzmode@example.com", "password": "Password123!", "full_name": "TZ Mode User"}
    )

    # Valid modes
    res_manual = auth_client.put("/api/v1/profile", json={"timezone_mode": "manual"})
    assert res_manual.status_code == status.HTTP_200_OK
    assert res_manual.json()["timezone_mode"] == "manual"

    res_auto = auth_client.put("/api/v1/profile", json={"timezone_mode": "auto"})
    assert res_auto.status_code == status.HTTP_200_OK
    assert res_auto.json()["timezone_mode"] == "auto"

    # Invalid mode rejected
    res_invalid = auth_client.put("/api/v1/profile", json={"timezone_mode": "invalid_mode"})
    assert res_invalid.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


def test_update_profile_theme_preference(auth_client: TestClient):
    auth_client.post(
        "/api/v1/auth/register",
        json={"email": "themeuser@example.com", "password": "Password123!", "full_name": "Theme User"}
    )

    # Valid themes
    for theme in ["light", "dark", "system"]:
        res = auth_client.put("/api/v1/profile", json={"theme_preference": theme})
        assert res.status_code == status.HTTP_200_OK
        assert res.json()["theme_preference"] == theme

    # Invalid theme rejected
    for bad_theme in ["neon", "blue", "hacker", "rainbow"]:
        res = auth_client.put("/api/v1/profile", json={"theme_preference": bad_theme})
        assert res.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


def test_profile_redundant_write_prevention(auth_client: TestClient):
    auth_client.post(
        "/api/v1/auth/register",
        json={"email": "redundant@example.com", "password": "Password123!", "full_name": "Redundant Test"}
    )
    initial_res = auth_client.put("/api/v1/profile", json={"timezone": "Europe/London"})
    assert initial_res.status_code == status.HTTP_200_OK
    initial_updated_at = initial_res.json()["updated_at"]
    assert initial_updated_at is not None

    # Redundant update with identical values
    no_op_res = auth_client.put("/api/v1/profile", json={"timezone": "Europe/London"})
    assert no_op_res.status_code == status.HTTP_200_OK
    assert no_op_res.json()["updated_at"] == initial_updated_at

    # Real change updates updated_at
    changed_res = auth_client.put("/api/v1/profile", json={"theme_preference": "dark"})
    assert changed_res.status_code == status.HTTP_200_OK
    assert changed_res.json()["theme_preference"] == "dark"


def test_profile_email_immutable(auth_client: TestClient):
    auth_client.post(
        "/api/v1/auth/register",
        json={"email": "immutable@example.com", "password": "Password123!", "full_name": "Immutable User"}
    )
    # Attempt to send email in PUT payload
    res = auth_client.put("/api/v1/profile", json={"email": "hacked@example.com", "full_name": "Changed Name"})
    assert res.status_code == status.HTTP_200_OK
    assert res.json()["email"] == "immutable@example.com"
    assert res.json()["full_name"] == "Changed Name"


def test_profile_multi_user_isolation(auth_client: TestClient):
    # Register User 1
    auth_client.post(
        "/api/v1/auth/register",
        json={"email": "user1_iso@example.com", "password": "Password123!", "full_name": "User One"}
    )
    auth_client.put("/api/v1/profile", json={"timezone": "Asia/Tokyo", "theme_preference": "dark"})

    # Register User 2
    auth_client.cookies.clear()
    auth_client.post(
        "/api/v1/auth/register",
        json={"email": "user2_iso@example.com", "password": "Password123!", "full_name": "User Two"}
    )

    # User 2 profile should have default settings and User 2 details
    res2 = auth_client.get("/api/v1/profile")
    assert res2.status_code == status.HTTP_200_OK
    data2 = res2.json()
    assert data2["email"] == "user2_iso@example.com"
    assert data2["full_name"] == "User Two"
    assert data2["timezone"] is None
    assert data2["theme_preference"] == "system"

    # User 2 updates their profile
    auth_client.put("/api/v1/profile", json={"timezone": "America/Chicago", "theme_preference": "light"})

    # User 1's profile is completely unchanged when logging back in
    auth_client.cookies.clear()
    auth_client.post(
        "/api/v1/auth/login",
        json={"email": "user1_iso@example.com", "password": "Password123!"}
    )
    res1 = auth_client.get("/api/v1/profile")
    data1 = res1.json()
    assert data1["email"] == "user1_iso@example.com"
    assert data1["full_name"] == "User One"
    assert data1["timezone"] == "Asia/Tokyo"
    assert data1["theme_preference"] == "dark"

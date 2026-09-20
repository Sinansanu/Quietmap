import pytest
from datetime import timedelta
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.main import app
from app.models.user import User
from app.models.location import Location
from app.models.focus_session import FocusSession
from app.models.noise_sample import NoiseSample
from app.core.security import create_access_token, hash_password
from app.api.dependencies import get_current_user, get_db


@pytest.fixture
def auth_client(db_session: Session) -> TestClient:
    """Client with real un-overridden authentication logic."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    # Clear any get_current_user override so real auth is verified
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides.pop(get_current_user, None)
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def test_register_success(auth_client: TestClient, db_session: Session):
    response = auth_client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "Password123!",
            "full_name": "New User"
        }
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["status"] == "authenticated"
    assert data["user"]["email"] == "newuser@example.com"
    assert data["user"]["full_name"] == "New User"
    # Verify access_token is NOT exposed in JSON body
    assert "access_token" not in data
    # Verify HttpOnly cookie is set
    assert "access_token" in response.cookies


def test_register_duplicate_email(auth_client: TestClient, db_session: Session):
    auth_client.post(
        "/api/v1/auth/register",
        json={"email": "duplicate@example.com", "password": "Password123!", "full_name": "Duplicate User"}
    )
    response = auth_client.post(
        "/api/v1/auth/register",
        json={"email": "duplicate@example.com", "password": "Password123!", "full_name": "Duplicate User"}
    )
    assert response.status_code == status.HTTP_409_CONFLICT
    assert "already exists" in response.json()["detail"]


def test_register_password_validation(auth_client: TestClient):
    # Too short (< 8 chars)
    res1 = auth_client.post(
        "/api/v1/auth/register",
        json={"email": "short@example.com", "password": "pass1", "full_name": "Valid Name"}
    )
    assert res1.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT

    # Missing digits
    res2 = auth_client.post(
        "/api/v1/auth/register",
        json={"email": "nonum@example.com", "password": "onlylettershere", "full_name": "Valid Name"}
    )
    assert res2.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


def test_register_full_name_validation(auth_client: TestClient):
    # Missing full_name
    res1 = auth_client.post(
        "/api/v1/auth/register",
        json={"email": "noname@example.com", "password": "Password123!"}
    )
    assert res1.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT

    # Whitespace only full_name
    res2 = auth_client.post(
        "/api/v1/auth/register",
        json={"email": "whitespacename@example.com", "password": "Password123!", "full_name": "   "}
    )
    assert res2.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT

    # Too short full_name (< 2 chars)
    res3 = auth_client.post(
        "/api/v1/auth/register",
        json={"email": "shortname@example.com", "password": "Password123!", "full_name": "A"}
    )
    assert res3.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


def test_login_success(auth_client: TestClient):
    auth_client.post(
        "/api/v1/auth/register",
        json={"email": "loginuser@example.com", "password": "Password123!", "full_name": "Login User"}
    )
    response = auth_client.post(
        "/api/v1/auth/login",
        json={"email": "loginuser@example.com", "password": "Password123!"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == "authenticated"
    assert data["user"]["email"] == "loginuser@example.com"
    assert "access_token" not in data
    assert "access_token" in response.cookies


def test_login_invalid_password(auth_client: TestClient):
    auth_client.post(
        "/api/v1/auth/register",
        json={"email": "wrongpass@example.com", "password": "Password123!", "full_name": "Wrong Pass User"}
    )
    response = auth_client.post(
        "/api/v1/auth/login",
        json={"email": "wrongpass@example.com", "password": "IncorrectPassword999"}
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Invalid email or password" in response.json()["detail"]


def test_login_nonexistent_user(auth_client: TestClient):
    response = auth_client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@example.com", "password": "Password123!"}
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_me_with_cookie(auth_client: TestClient):
    auth_client.post(
        "/api/v1/auth/register",
        json={"email": "cookietest@example.com", "password": "Password123!", "full_name": "Cookie Tester"}
    )
    # The cookie is automatically held in TestClient session
    response = auth_client.get("/api/v1/auth/me")
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["email"] == "cookietest@example.com"


def test_get_me_with_bearer_token(auth_client: TestClient):
    auth_client.post(
        "/api/v1/auth/register",
        json={"email": "bearertest@example.com", "password": "Password123!", "full_name": "Bearer Tester"}
    )
    # Call /auth/token endpoint
    token_res = auth_client.post(
        "/api/v1/auth/token",
        json={"email": "bearertest@example.com", "password": "Password123!"}
    )
    token = token_res.json()["access_token"]

    # Clear client cookies to ensure header is used
    auth_client.cookies.clear()

    response = auth_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["email"] == "bearertest@example.com"


def test_get_me_unauthorized(auth_client: TestClient):
    auth_client.cookies.clear()
    response = auth_client.get("/api/v1/auth/me")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_expired_token(auth_client: TestClient, db_session: Session):
    user = User(
        id="expired-user-id",
        email="expired@example.com",
        hashed_password=hash_password("Password123!"),
        full_name="Expired User",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()

    # Generate token expired 1 hour ago
    expired_token = create_access_token(user.id, expires_delta=timedelta(hours=-1))

    response = auth_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"}
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Invalid or expired" in response.json()["detail"]


def test_logout_clears_cookie(auth_client: TestClient):
    auth_client.post(
        "/api/v1/auth/register",
        json={"email": "logout@example.com", "password": "Password123!", "full_name": "Logout Tester"}
    )
    assert "access_token" in auth_client.cookies

    logout_res = auth_client.post("/api/v1/auth/logout")
    assert logout_res.status_code == status.HTTP_200_OK

    # Calling /auth/me after logout should now fail
    me_res = auth_client.get("/api/v1/auth/me")
    assert me_res.status_code == status.HTTP_401_UNAUTHORIZED


def test_atomic_first_user_legacy_claim(auth_client: TestClient, db_session: Session):
    # Clean any pre-existing users
    db_session.query(User).delete()
    db_session.commit()

    # Create unassigned legacy records
    loc = Location(name="Legacy Library", user_id=None)
    db_session.add(loc)
    db_session.commit()

    # First user registers
    reg_res = auth_client.post(
        "/api/v1/auth/register",
        json={"email": "user1@example.com", "password": "Password123!", "full_name": "User One"}
    )
    assert reg_res.status_code == status.HTTP_201_CREATED
    user1_id = reg_res.json()["user"]["id"]

    # Verify the legacy location is now owned by user1
    db_session.refresh(loc)
    assert loc.user_id == user1_id


def test_second_user_isolation(auth_client: TestClient, db_session: Session):
    # First user already claimed legacy data or created workspaces
    auth_client.post(
        "/api/v1/auth/register",
        json={"email": "first@example.com", "password": "Password123!", "full_name": "First User"}
    )
    auth_client.post(
        "/api/v1/locations",
        json={"name": "First User Desk"}
    )

    # Second user registers
    auth_client.cookies.clear()
    auth_client.post(
        "/api/v1/auth/register",
        json={"email": "second@example.com", "password": "Password123!", "full_name": "Second User"}
    )

    # Second user checks locations: should NOT see First User's locations!
    locs_res = auth_client.get("/api/v1/locations")
    locs = locs_res.json()
    names = [l["name"] for l in locs]
    assert "First User Desk" not in names


def test_cross_user_location_isolation(auth_client: TestClient, db_session: Session):
    # Register User A
    auth_client.post(
        "/api/v1/auth/register",
        json={"email": "usera@example.com", "password": "Password123!", "full_name": "User A"}
    )
    res_a = auth_client.post("/api/v1/locations", json={"name": "Confidential Project Room"})
    loc_a_id = res_a.json()["id"]

    # Register User B
    auth_client.cookies.clear()
    auth_client.post(
        "/api/v1/auth/register",
        json={"email": "userb@example.com", "password": "Password123!", "full_name": "User B"}
    )

    # User B attempts to access User A's location by ID -> 404
    get_res = auth_client.get(f"/api/v1/locations/{loc_a_id}")
    assert get_res.status_code == status.HTTP_404_NOT_FOUND

    # User B attempts to delete User A's location -> 404
    del_res = auth_client.delete(f"/api/v1/locations/{loc_a_id}")
    assert del_res.status_code == status.HTTP_404_NOT_FOUND


def test_cross_user_session_and_noise_isolation(auth_client: TestClient, db_session: Session):
    # User A creates location and starts session
    auth_client.post(
        "/api/v1/auth/register",
        json={"email": "usera2@example.com", "password": "Password123!", "full_name": "User A2"}
    )
    loc_a = auth_client.post("/api/v1/locations", json={"name": "User A Office"}).json()
    sess_a = auth_client.post(
        "/api/v1/sessions/start",
        json={"location_id": loc_a["id"], "activity": "Secret Work"}
    ).json()

    # User A records noise sample
    auth_client.post(
        "/api/v1/noise/sample",
        json={"noise_level": 45.0, "location_id": loc_a["id"], "focus_session_id": sess_a["id"]}
    )

    # Switch to User B
    auth_client.cookies.clear()
    auth_client.post(
        "/api/v1/auth/register",
        json={"email": "userb2@example.com", "password": "Password123!", "full_name": "User B2"}
    )

    # User B should have NO active session
    active_res = auth_client.get("/api/v1/sessions/active")
    assert active_res.json() is None

    # User B attempts to end User A's session -> 404
    end_res = auth_client.post(f"/api/v1/sessions/{sess_a['id']}/end")
    assert end_res.status_code == status.HTTP_404_NOT_FOUND

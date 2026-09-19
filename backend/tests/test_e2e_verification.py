import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.api.dependencies import get_current_user, get_db


@pytest.fixture
def auth_client(db_session: Session) -> TestClient:
    """Real client without dependency overrides on authentication."""
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


def test_automated_auth_lifecycle_e2e(auth_client: TestClient):
    """
    Automated Authentication Lifecycle E2E Test (FastAPI TestClient with Cookie Jar)

    Step 1: Register account (HttpOnly cookie set, zero token exposure in JSON)
    Step 2: Verify login & dashboard load
    Step 3: Simulate browser refresh (re-fetch auth state via cookie)
    Step 4: Create workspace
    Step 5: Start focus session
    Step 6: Submit noise monitoring telemetry
    Step 7: Sign out & verify auth screen gating (401 Unauthorized)
    Step 8: Log in again & verify data restored
    """
    email = "cartographer_a@example.com"
    password = "SafePassword99!"
    full_name = "Cartographer Alpha"

    # 1. Register account
    reg_res = auth_client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": full_name}
    )
    assert reg_res.status_code == status.HTTP_201_CREATED
    reg_data = reg_res.json()
    assert reg_data["status"] == "authenticated"
    assert reg_data["user"]["email"] == email
    assert reg_data["user"]["full_name"] == full_name
    assert "access_token" not in reg_data  # Zero token exposure in JSON
    assert "access_token" in auth_client.cookies

    # 2. Verify /auth/me returns the registered user
    me_res = auth_client.get("/api/v1/auth/me")
    assert me_res.status_code == status.HTTP_200_OK
    assert me_res.json()["email"] == email

    # 3. Verify Dashboard loads
    dash_res = auth_client.get("/api/v1/dashboard")
    assert dash_res.status_code == status.HTTP_200_OK
    dash_data = dash_res.json()
    assert "locations" in dash_data
    assert "completed_today" in dash_data

    # 4. Simulate Browser Refresh: re-query /auth/me using preserved cookie
    refresh_me = auth_client.get("/api/v1/auth/me")
    assert refresh_me.status_code == status.HTTP_200_OK
    assert refresh_me.json()["email"] == email

    # 5. Create Workspace
    loc_res = auth_client.post("/api/v1/locations", json={"name": "Alpha Home Studio"})
    assert loc_res.status_code == status.HTTP_201_CREATED
    loc_id = loc_res.json()["id"]
    assert loc_res.json()["name"] == "Alpha Home Studio"

    # 6. Start Focus Session
    sess_res = auth_client.post(
        "/api/v1/sessions/start",
        json={"location_id": loc_id, "activity": "Deep Cartography"}
    )
    assert sess_res.status_code == status.HTTP_201_CREATED
    sess_id = sess_res.json()["id"]
    assert sess_res.json()["activity"] == "Deep Cartography"
    assert sess_res.json()["location_id"] == loc_id

    # 7. Noise monitoring works: submit multiple telemetry samples
    for level in [32.5, 34.0, 31.8, 35.2]:
        noise_res = auth_client.post(
            "/api/v1/noise/sample",
            json={"noise_level": level, "location_id": loc_id, "focus_session_id": sess_id}
        )
        assert noise_res.status_code == status.HTTP_201_CREATED
        assert noise_res.json()["noise_level"] == pytest.approx(level, 0.1)

    # Check latest noise sample
    latest_res = auth_client.get("/api/v1/noise/latest")
    assert latest_res.status_code == status.HTTP_200_OK
    assert latest_res.json()["noise_level"] == pytest.approx(35.2, 0.1)

    # End focus session
    end_res = auth_client.post(f"/api/v1/sessions/{sess_id}/end")
    assert end_res.status_code == status.HTTP_200_OK
    assert end_res.json()["focus_score"] is not None

    # 8. Sign out
    logout_res = auth_client.post("/api/v1/auth/logout")
    assert logout_res.status_code == status.HTTP_200_OK
    # Verify cookie was invalidated/expired
    assert auth_client.cookies.get("access_token") is None or auth_client.cookies.get("access_token") == '""' or auth_client.cookies.get("access_token") == ""

    # Clear test client cookie store to simulate fresh browser unauthenticated state
    auth_client.cookies.clear()

    # 9. Verify Auth screen appears (unauthorized access to /auth/me and protected routes)
    unauth_me = auth_client.get("/api/v1/auth/me")
    assert unauth_me.status_code == status.HTTP_401_UNAUTHORIZED
    unauth_dash = auth_client.get("/api/v1/dashboard")
    assert unauth_dash.status_code == status.HTTP_401_UNAUTHORIZED

    # 10. Login again
    login_res = auth_client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password}
    )
    assert login_res.status_code == status.HTTP_200_OK
    assert login_res.json()["status"] == "authenticated"
    assert "access_token" in auth_client.cookies

    # 11. Verify previous user data is restored
    restored_dash = auth_client.get("/api/v1/dashboard")
    assert restored_dash.status_code == status.HTTP_200_OK
    loc_names = [l["name"] for l in restored_dash.json()["locations"]]
    assert "Alpha Home Studio" in loc_names

    history_res = auth_client.get("/api/v1/sessions/history")
    assert history_res.status_code == status.HTTP_200_OK
    sess_ids = [s["id"] for s in history_res.json()]
    assert sess_id in sess_ids


def test_automated_multi_user_isolation_e2e(auth_client: TestClient):
    """
    Automated Multi-User Isolation E2E Test (FastAPI TestClient with Cookie Jar)

    User A:
      - Create workspace
      - Create and use focus session
      - Generate noise samples
    User B:
      - Register and login
      - Verify User A's workspace, session, and noise telemetry are NOT visible
      - Create User B data
    User A:
      - Login again
      - Verify User B's data is NOT visible
    """
    user_a_email = "user_a_iso@example.com"
    user_a_pass = "UserAPassword1!"
    user_b_email = "user_b_iso@example.com"
    user_b_pass = "UserBPassword2!"

    # --- USER A SETUP ---
    reg_a = auth_client.post(
        "/api/v1/auth/register",
        json={"email": user_a_email, "password": user_a_pass, "full_name": "User Alpha"}
    )
    assert reg_a.status_code == status.HTTP_201_CREATED

    loc_a = auth_client.post("/api/v1/locations", json={"name": "User A Private Office"}).json()
    sess_a = auth_client.post(
        "/api/v1/sessions/start",
        json={"location_id": loc_a["id"], "activity": "User A Research"}
    ).json()

    auth_client.post(
        "/api/v1/noise/sample",
        json={"noise_level": 42.0, "location_id": loc_a["id"], "focus_session_id": sess_a["id"]}
    )

    auth_client.post(f"/api/v1/sessions/{sess_a['id']}/end")

    # Logout User A
    auth_client.post("/api/v1/auth/logout")
    auth_client.cookies.clear()

    # --- USER B SETUP & VERIFICATION ---
    reg_b = auth_client.post(
        "/api/v1/auth/register",
        json={"email": user_b_email, "password": user_b_pass, "full_name": "User Beta"}
    )
    assert reg_b.status_code == status.HTTP_201_CREATED

    # User B checks locations: User A's location MUST NOT be present
    b_locs = auth_client.get("/api/v1/locations").json()
    assert all(l["name"] != "User A Private Office" for l in b_locs)

    # User B attempts direct access to User A's location -> 404
    b_get_a_loc = auth_client.get(f"/api/v1/locations/{loc_a['id']}")
    assert b_get_a_loc.status_code == status.HTTP_404_NOT_FOUND

    # User B checks session history: User A's session MUST NOT be present
    b_history = auth_client.get("/api/v1/sessions/history").json()
    assert all(s["id"] != sess_a["id"] for s in b_history)

    # User B checks timeline: User A's noise samples MUST NOT be in User B's timeline
    b_timeline = auth_client.get("/api/v1/timeline?range=day").json()
    assert len(b_timeline["samples"]) == 0

    # User B creates own data
    loc_b = auth_client.post("/api/v1/locations", json={"name": "User B Creative Lab"}).json()
    sess_b = auth_client.post(
        "/api/v1/sessions/start",
        json={"location_id": loc_b["id"], "activity": "User B Design"}
    ).json()
    auth_client.post(
        "/api/v1/noise/sample",
        json={"noise_level": 25.0, "location_id": loc_b["id"], "focus_session_id": sess_b["id"]}
    )
    auth_client.post(f"/api/v1/sessions/{sess_b['id']}/end")

    # Logout User B
    auth_client.post("/api/v1/auth/logout")
    auth_client.cookies.clear()

    # --- USER A RE-LOGIN & VERIFICATION ---
    auth_client.post(
        "/api/v1/auth/login",
        json={"email": user_a_email, "password": user_a_pass}
    )

    # User A checks locations: User B's location MUST NOT be present
    a_locs = auth_client.get("/api/v1/locations").json()
    a_loc_names = [l["name"] for l in a_locs]
    assert "User A Private Office" in a_loc_names
    assert "User B Creative Lab" not in a_loc_names

    # User A attempts direct access to User B's location -> 404
    a_get_b_loc = auth_client.get(f"/api/v1/locations/{loc_b['id']}")
    assert a_get_b_loc.status_code == status.HTTP_404_NOT_FOUND

    # User A checks session history: User B's session MUST NOT be present
    a_history = auth_client.get("/api/v1/sessions/history").json()
    a_sess_ids = [s["id"] for s in a_history]
    assert sess_a["id"] in a_sess_ids
    assert sess_b["id"] not in a_sess_ids

from fastapi.testclient import TestClient


def test_session_lifecycle(client: TestClient):
    # 1. Create a location first
    loc_res = client.post("/api/v1/locations", json={"name": "Library Study"})
    assert loc_res.status_code == 201
    loc_id = loc_res.json()["id"]

    # 2. No active session initially
    res = client.get("/api/v1/sessions/active")
    assert res.status_code == 200
    assert res.json() is None

    # 3. Start a session
    start_res = client.post("/api/v1/sessions/start", json={"location_id": loc_id, "activity": "Deep Research"})
    assert start_res.status_code == 201
    session_data = start_res.json()
    sess_id = session_data["id"]
    assert session_data["activity"] == "Deep Research"
    assert session_data["location_id"] == loc_id
    assert session_data["ended_at"] is None

    # 4. Attempting to start a second session while one is active returns 409 Conflict
    conflict_res = client.post("/api/v1/sessions/start", json={"location_id": loc_id})
    assert conflict_res.status_code == 409

    # 5. Check active session endpoint
    active_res = client.get("/api/v1/sessions/active")
    assert active_res.status_code == 200
    assert active_res.json()["id"] == sess_id

    # 6. Record a few noise samples during this session
    client.post("/api/v1/noise/sample", json={"noise_level": 22.0, "focus_session_id": sess_id, "location_id": loc_id})
    client.post("/api/v1/noise/sample", json={"noise_level": 24.0, "focus_session_id": sess_id, "location_id": loc_id})

    # 7. End the session
    end_res = client.post(f"/api/v1/sessions/{sess_id}/end")
    assert end_res.status_code == 200
    end_data = end_res.json()
    assert end_data["id"] == sess_id
    assert 0 <= end_data["focus_score"] <= 100
    assert end_data["average_noise"] == 23.0

    # 8. Active session is now None
    active_after = client.get("/api/v1/sessions/active")
    assert active_after.json() is None

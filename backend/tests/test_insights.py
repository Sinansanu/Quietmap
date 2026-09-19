from fastapi.testclient import TestClient


def test_insights_sparse_data_safety(client: TestClient):
    # 1. Empty database - MUST NOT CRASH
    res = client.get("/api/v1/insights")
    assert res.status_code == 200
    data = res.json()
    assert data["ready"] is False
    assert "reason" in data
    assert data["sample_count"] == 0

    # 2. Sparse data (e.g. 5 samples, 1 session) - MUST NOT CRASH
    loc_res = client.post("/api/v1/locations", json={"name": "Corner Desk"})
    loc_id = loc_res.json()["id"]

    sess_res = client.post("/api/v1/sessions/start", json={"location_id": loc_id})
    sess_id = sess_res.json()["id"]

    for i in range(5):
        client.post("/api/v1/noise/sample", json={"noise_level": 20.0 + i, "focus_session_id": sess_id})

    client.post(f"/api/v1/sessions/{sess_id}/end")

    res_sparse = client.get("/api/v1/insights")
    assert res_sparse.status_code == 200
    assert res_sparse.json()["ready"] is False
    assert res_sparse.json()["sample_count"] == 5

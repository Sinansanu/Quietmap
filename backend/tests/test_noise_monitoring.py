from fastapi.testclient import TestClient


def test_noise_sampling_and_interruption_detection(client: TestClient):
    # 1. Start a session to observe interruptions
    loc_res = client.post("/api/v1/locations", json={"name": "Quiet Room"})
    loc_id = loc_res.json()["id"]

    sess_res = client.post("/api/v1/sessions/start", json={"location_id": loc_id, "activity": "Coding"})
    sess_id = sess_res.json()["id"]

    # 2. Ingest baseline quiet noise (20.0)
    res1 = client.post("/api/v1/noise/sample", json={
        "noise_level": 20.0,
        "focus_session_id": sess_id,
        "location_id": loc_id
    })
    assert res1.status_code == 201

    # Ingest second sample at 22.0
    res2 = client.post("/api/v1/noise/sample", json={
        "noise_level": 22.0,
        "focus_session_id": sess_id,
        "location_id": loc_id
    })
    assert res2.status_code == 201

    # 3. Ingest sudden spike: 65.0 (Delta = 45 > threshold of 18)
    res_spike = client.post("/api/v1/noise/sample", json={
        "noise_level": 65.0,
        "focus_session_id": sess_id,
        "location_id": loc_id
    })
    assert res_spike.status_code == 201

    # 4. Check latest noise endpoint
    latest_res = client.get("/api/v1/noise/latest")
    assert latest_res.status_code == 200
    latest_data = latest_res.json()
    assert latest_data["noise_level"] == 65.0
    assert latest_data["label"] in ["Noisy", "Moderate", "Very noisy"]

    # 5. End session and verify interruption was recorded!
    end_res = client.post(f"/api/v1/sessions/{sess_id}/end")
    assert end_res.status_code == 200
    assert end_res.json()["interruptions"] >= 1

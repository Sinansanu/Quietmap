from fastapi.testclient import TestClient


def test_timeline_bucketing_and_validation(client: TestClient):
    # 1. Timeline when empty
    res = client.get("/api/v1/timeline?range=day")
    assert res.status_code == 200
    data = res.json()
    assert data["range"] == "day"
    assert data["samples"] == []

    # 2. Ingest several samples
    for lvl in [18.0, 25.0, 32.0, 28.0]:
        client.post("/api/v1/noise/sample", json={"noise_level": lvl})

    # 3. Retrieve day timeline
    res = client.get("/api/v1/timeline?range=day")
    assert res.status_code == 200
    data = res.json()
    assert len(data["samples"]) >= 1
    bucket = data["samples"][0]
    assert "noise_level" in bucket
    assert "noise_min" in bucket
    assert "noise_max" in bucket
    assert "sample_count" in bucket

    # 4. Invalid range fails validation
    bad_res = client.get("/api/v1/timeline?range=invalid_range")
    assert bad_res.status_code == 422

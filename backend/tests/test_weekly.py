from fastapi.testclient import TestClient


def test_weekly_report_independent_of_sessions(client: TestClient):
    # 1. Ingest only noise samples without completing any focus session
    for lvl in [20.0, 35.0, 42.0]:
        client.post("/api/v1/noise/sample", json={"noise_level": lvl})

    res = client.get("/api/v1/weekly")
    assert res.status_code == 200
    data = res.json()
    assert "days" in data
    assert len(data["days"]) == 7  # 7 days are always represented
    assert "total_interruptions" in data
    assert "longest_session_minutes" in data

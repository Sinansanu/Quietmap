from fastapi.testclient import TestClient


def test_seed_demo_and_reset(client: TestClient):
    # 1. Trigger demo data generation
    res = client.post("/api/v1/seed?days=7")
    assert res.status_code == 200
    assert res.json()["seeded_days"] == 7

    # 2. Check locations were populated
    loc_res = client.get("/api/v1/locations")
    assert loc_res.status_code == 200
    assert len(loc_res.json()) >= 3

    # 3. Check Focus Map now has non-empty metrics
    map_res = client.get("/api/v1/focus-map")
    assert map_res.status_code == 200
    assert len(map_res.json()) >= 3

    # 4. Check Insights is now ready!
    insights_res = client.get("/api/v1/insights")
    assert insights_res.status_code == 200
    assert insights_res.json()["ready"] is True
    assert insights_res.json()["quietest"] is not None
    assert insights_res.json()["best_location"] is not None

    # 5. Delete all data
    del_res = client.post("/api/v1/settings/delete-all")
    assert del_res.status_code == 200
    assert del_res.json()["deleted"] is True

    # 6. Verify locations are now empty
    loc_empty = client.get("/api/v1/locations")
    assert loc_empty.json() == []

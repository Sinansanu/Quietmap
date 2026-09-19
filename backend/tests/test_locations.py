from fastapi.testclient import TestClient


def test_location_crud(client: TestClient):
    # 1. Initially empty
    res = client.get("/api/v1/locations")
    assert res.status_code == 200
    assert res.json() == []

    # 2. Create location
    res = client.post("/api/v1/locations", json={"name": "Office Desk"})
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Office Desk"
    assert "id" in data
    loc_id = data["id"]

    # 3. Duplicate name returns 409
    res = client.post("/api/v1/locations", json={"name": "office desk"})
    assert res.status_code == 409

    # 4. Get by ID
    res = client.get(f"/api/v1/locations/{loc_id}")
    assert res.status_code == 200
    assert res.json()["id"] == loc_id

    # 5. Update location
    res = client.put(f"/api/v1/locations/{loc_id}", json={"name": "Standing Desk"})
    assert res.status_code == 200
    assert res.json()["name"] == "Standing Desk"

    # 6. Delete location
    res = client.delete(f"/api/v1/locations/{loc_id}")
    assert res.status_code == 204

    # 7. Get after delete returns 404
    res = client.get(f"/api/v1/locations/{loc_id}")
    assert res.status_code == 404

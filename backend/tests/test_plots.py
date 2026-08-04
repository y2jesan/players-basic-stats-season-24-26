def test_shot_map_returns_png(client):
    response = client.get("/api/plots/shot-map", params={"match_id": "match-1"})
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"
    assert len(response.content) > 0

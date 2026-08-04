def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_hello(client):
    response = client.get("/api/hello")
    assert response.status_code == 200
    body = response.json()
    assert "greeting" in body
    assert "server_time_utc" in body

import pytest

from app import app


@pytest.fixture()
def client():
    app.config.update(TESTING=True)
    with app.test_client() as test_client:
        yield test_client


def test_home_page(client):
    response = client.get("/")
    assert response.status_code == 200
    assert b"2048" in response.data


def test_health_endpoint(client):
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.get_json() == {"status": "ok"}


def test_readiness_endpoint(client):
    response = client.get("/readyz")
    assert response.status_code == 200
    assert response.get_json() == {"status": "ready"}


def test_valid_move(client):
    response = client.post("/api/move", json={"direction": "left"})
    assert response.status_code == 200
    assert response.get_json() == {"status": "ok"}


def test_invalid_move(client):
    response = client.post("/api/move", json={"direction": "diagonal"})
    assert response.status_code == 400
    assert response.get_json() == {"error": "invalid direction"}


def test_reset(client):
    response = client.post("/api/reset")
    assert response.status_code == 200
    assert response.get_json() == {"status": "ok"}


def test_metrics(client):
    response = client.get("/metrics")
    assert response.status_code == 200
    assert b"flask_http_requests_total" in response.data

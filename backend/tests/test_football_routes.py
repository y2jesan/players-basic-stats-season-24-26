import json

import pytest
from fastapi.testclient import TestClient

from app import sample_data
from app.config import get_settings
from app.main import app

CSV_CONTENT = (
    "Player,Nation,Pos,Squad,Comp,Age,Born,MP,Min,Gls,Ast,G+A,Crs,TklW,Int,Fls,CrdY,CrdR\n"
    "Alice Striker,eng ENG,FW,Test United,eng Premier League,24,2001,20,1800,10,4,14,5,8,3,12,1,0\n"
    "Bob Keeper,es ESP,GK,Test United,eng Premier League,29,1996,18,1620,0,0,0,0,1,0,2,0,0\n"
    "Carlos Winger,es ESP,MF,Real Testo,es La Liga,22,2003,15,1200,3,6,9,20,15,10,8,2,0\n"
)

STAT_TYPE_CONTENT = [
    {"property": "MP", "type": "match"},
    {"property": "Min", "type": "match"},
    {"property": "Gls", "type": "shooting"},
    {"property": "Ast", "type": "passing"},
    {"property": "G+A", "type": "shooting"},
    {"property": "Crs", "type": "passing"},
    {"property": "TklW", "type": "defending"},
    {"property": "Int", "type": "defending"},
    {"property": "Fls", "type": "decipline"},
    {"property": "CrdY", "type": "decipline"},
    {"property": "CrdR", "type": "decipline"},
]


@pytest.fixture
def client(tmp_path, monkeypatch) -> TestClient:
    (tmp_path / "players_data-2025_2026.csv").write_text(CSV_CONTENT)
    (tmp_path / "stat-type.json").write_text(json.dumps(STAT_TYPE_CONTENT))

    monkeypatch.setenv("DATASET_DIR", str(tmp_path))
    get_settings.cache_clear()
    sample_data.get_football_players.cache_clear()
    sample_data.get_stat_type_map.cache_clear()

    yield TestClient(app)

    get_settings.cache_clear()
    sample_data.get_football_players.cache_clear()
    sample_data.get_stat_type_map.cache_clear()


def test_seasons(client: TestClient):
    res = client.get("/api/football/seasons")
    assert res.status_code == 200
    assert res.json() == [{"id": "2025-2026", "label": "2025/2026"}]


def test_competitions(client: TestClient):
    res = client.get("/api/football/competitions")
    assert res.status_code == 200
    ids = {c["competition_id"] for c in res.json()}
    assert ids == {"premier-league", "la-liga"}


def test_summary_scoped_by_competition(client: TestClient):
    res = client.get("/api/football/summary", params={"competition": "premier-league"})
    assert res.status_code == 200
    body = res.json()
    assert body["total_competitions"] == 2
    assert body["total_teams"] == 1
    assert body["total_players"] == 2
    assert body["total_goals"] == 10


def test_teams_list_and_filter(client: TestClient):
    res = client.get("/api/football/teams", params={"competition": "la-liga"})
    assert res.status_code == 200
    teams = res.json()
    assert len(teams) == 1
    assert teams[0]["name"] == "Real Testo"
    assert teams[0]["player_count"] == 1


def test_team_detail_found_and_not_found(client: TestClient):
    ok = client.get("/api/football/teams/test-united")
    assert ok.status_code == 200
    body = ok.json()
    assert body["team"]["player_count"] == 2
    assert {p["name"] for p in body["players"]} == {"Alice Striker", "Bob Keeper"}

    missing = client.get("/api/football/teams/does-not-exist")
    assert missing.status_code == 404


def test_countries_list(client: TestClient):
    res = client.get("/api/football/countries")
    assert res.status_code == 200
    by_code = {c["code"]: c for c in res.json()}
    assert by_code["eng"]["player_count"] == 1
    assert by_code["es"]["player_count"] == 2


def test_country_detail_found_and_not_found(client: TestClient):
    ok = client.get("/api/football/countries/es")
    assert ok.status_code == 200
    body = ok.json()
    assert body["country"]["player_count"] == 2
    assert {p["name"] for p in body["players"]} == {"Bob Keeper", "Carlos Winger"}
    assert {p["team_name"] for p in body["players"]} == {"Test United", "Real Testo"}

    missing = client.get("/api/football/countries/zz")
    assert missing.status_code == 404


def test_leaderboards(client: TestClient):
    res = client.get("/api/football/leaderboards")
    assert res.status_code == 200
    body = res.json()
    assert set(body.keys()) == {"shooting", "passing", "match", "defending", "discipline"}
    assert body["shooting"][0]["name"] == "Alice Striker"
    assert body["shooting"][0]["goals"] == 10
    assert body["defending"][0]["name"] == "Carlos Winger"


def test_player_detail_found_and_not_found(client: TestClient):
    team = client.get("/api/football/teams/test-united").json()
    striker_id = next(p["player_id"] for p in team["players"] if p["name"] == "Alice Striker")

    ok = client.get(f"/api/football/players/{striker_id}")
    assert ok.status_code == 200
    body = ok.json()
    assert body["profile"]["name"] == "Alice Striker"
    card_types = {c["type"] for c in body["cards"]}
    assert "shooting" in card_types

    missing = client.get("/api/football/players/does-not-exist")
    assert missing.status_code == 404

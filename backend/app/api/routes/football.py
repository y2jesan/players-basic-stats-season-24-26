from fastapi import APIRouter, HTTPException

from app.analytics.football_catalog import (
    compute_dashboard_summary,
    list_competitions,
    list_countries,
    list_seasons,
    list_stat_glossary,
)
from app.analytics.football_countries import get_country_detail
from app.analytics.football_leaderboards import get_leaderboards
from app.analytics.football_players import get_player_detail
from app.analytics.football_teams import get_team_detail, list_teams
from app.sample_data import (
    default_season,
    get_football_players,
    get_stat_reference,
    get_stat_type_map,
)

router = APIRouter(prefix="/football")


@router.get("/seasons")
def get_seasons():
    return list_seasons(get_football_players())


@router.get("/competitions")
def get_competitions(season: str | None = None):
    return list_competitions(get_football_players(), season=season)


@router.get("/countries")
def get_countries(season: str | None = None, competition: str | None = None):
    return list_countries(get_football_players(), season=season, competition=competition)


@router.get("/countries/{country_code}")
def get_country(country_code: str, season: str | None = None):
    detail = get_country_detail(get_football_players(), country_code, season=season or default_season())
    if detail is None:
        raise HTTPException(status_code=404, detail="Country not found")
    return detail


@router.get("/leaderboards")
def get_leaderboards_route(season: str | None = None):
    players = get_football_players()
    players = players.filter(players["season"] == (season or default_season()))
    return get_leaderboards(players)


@router.get("/stat-glossary")
def get_stat_glossary():
    return list_stat_glossary(get_stat_reference())


@router.get("/summary")
def get_summary(season: str | None = None, competition: str | None = None):
    return compute_dashboard_summary(get_football_players(), season=season, competition=competition)


@router.get("/teams")
def get_teams(season: str | None = None, competition: str | None = None):
    players = get_football_players()
    if season:
        players = players.filter(players["season"] == season)
    return list_teams(players, competition=competition).to_dicts()


@router.get("/teams/{team_id}")
def get_team(team_id: str, season: str | None = None):
    detail = get_team_detail(get_football_players(), team_id, season=season or default_season())
    if detail is None:
        raise HTTPException(status_code=404, detail="Team not found")
    return detail


@router.get("/players/{player_id}")
def get_player(player_id: str, season: str | None = None):
    # Percentile computation needs the full (unfiltered) player pool to build its
    # league/season scopes, so get_player_detail does its own season filtering
    # internally (mirroring get_team_detail/get_country_detail) rather than being
    # handed an already-scoped DataFrame here. Unlike teams/countries, we don't
    # default to the newest season when omitted, since that would 404 a valid
    # old-season bookmark — player_id is already globally unique (season-prefixed).
    detail = get_player_detail(get_football_players(), get_stat_type_map(), player_id, season=season)
    if detail is None:
        raise HTTPException(status_code=404, detail="Player not found")
    return detail

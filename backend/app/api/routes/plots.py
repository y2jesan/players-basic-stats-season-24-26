from fastapi import APIRouter, HTTPException, Response

from app.plots.heatmap import build_heatmap
from app.plots.render import render_png
from app.plots.shot_map import build_shot_map
from app.sample_data import get_matches, get_player_touches, get_players, get_shots

router = APIRouter()


@router.get("/plots/shot-map")
def get_shot_map_plot(match_id: str):
    all_matches = get_matches()
    matches = all_matches.filter(all_matches["match_id"] == match_id)
    if matches.is_empty():
        raise HTTPException(status_code=404, detail="Match not found")
    match = matches.row(0, named=True)
    title = f"{match['home_team']} {match['home_score']}-{match['away_score']} {match['away_team']}"

    fig = build_shot_map(get_shots(match_id), title)
    return Response(content=render_png(fig), media_type="image/png")


@router.get("/plots/heatmap")
def get_heatmap_plot(player_id: str):
    all_players = get_players()
    players = all_players.filter(all_players["player_id"] == player_id)
    if players.is_empty():
        raise HTTPException(status_code=404, detail="Player not found")
    title = f"{players.row(0, named=True)['name']} — touch map"

    fig = build_heatmap(get_player_touches(player_id), title)
    return Response(content=render_png(fig), media_type="image/png")

from fastapi import APIRouter

from app.analytics.summary import compute_summary
from app.analytics.timeline import compute_timeline
from app.sample_data import get_matches, get_players, get_teams

router = APIRouter()


@router.get("/stats/summary")
def get_summary():
    return compute_summary(get_teams(), get_players(), get_matches())


@router.get("/stats/timeline")
def get_timeline():
    return compute_timeline(get_matches()).to_dicts()

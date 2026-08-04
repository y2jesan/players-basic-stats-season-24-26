from typing import Any

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.analytics.players import paginate_players
from app.sample_data import get_players

router = APIRouter()


class PlayersPage(BaseModel):
    rows: list[dict[str, Any]]
    total: int
    page: int
    page_size: int


@router.get("/players", response_model=PlayersPage)
def list_players(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    sort: str | None = None,
    order: str = Query(default="asc", pattern="^(asc|desc)$"),
    q: str | None = None,
    position: str | None = None,
):
    rows, total = paginate_players(
        get_players(),
        page=page,
        page_size=page_size,
        sort=sort,
        order=order,
        q=q,
        position=position,
    )
    return PlayersPage(
        rows=rows.to_dicts(), total=total, page=page, page_size=page_size
    )

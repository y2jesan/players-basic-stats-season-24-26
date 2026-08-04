import polars as pl

from app.analytics.players import paginate_players

FIXTURE = pl.DataFrame(
    {
        "name": ["Alice Smith", "Bob Jones", "Cara Lee"],
        "position": ["FW", "MF", "FW"],
        "goals": [10, 3, 7],
    }
)


def test_paginate_players_sorts_and_paginates():
    rows, total = paginate_players(
        FIXTURE, page=1, page_size=2, sort="goals", order="desc"
    )
    assert total == 3
    assert rows["name"].to_list() == ["Alice Smith", "Cara Lee"]


def test_paginate_players_filters_by_position_and_query():
    rows, total = paginate_players(
        FIXTURE, page=1, page_size=10, position="FW", q="cara"
    )
    assert total == 1
    assert rows["name"].to_list() == ["Cara Lee"]

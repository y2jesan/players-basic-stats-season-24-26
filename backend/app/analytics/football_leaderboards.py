"""Cross-competition player leaderboards for the dashboard.

Primary rankings stay on simple counting stats (goals/G+A for shooting, assists/
crosses for passing, minutes/matches for match, tackles won/interceptions for
defending, fouls/cards for discipline) rather than switching to xG/passing-detail
columns, because those are only populated for seasons whose CSV merged in FBref's
passing/shooting-detail tables (currently just 2024-2025) — sorting by a column
that's null for an entire season would leave that season's leaderboard empty.
Instead, xG/xAG/passing-detail values are added as extra optional fields via
_format()'s existing row.get(column) (already null-tolerant), so they populate
when available and stay null otherwise.
"""

import polars as pl

from app.analytics.football_common import parse_code_name, split_positions

LEADERBOARD_LIMIT = 100


def _format(df: pl.DataFrame, stat_map: dict[str, str]) -> list[dict]:
    rows = []
    for row in df.iter_rows(named=True):
        entry = {
            "player_id": row["player_id"],
            "name": row["Player"],
            "team_id": row["team_id"],
            "team_name": row["Squad"],
            "positions": split_positions(row.get("Pos")),
            "competition": parse_code_name(row.get("Comp")),
        }
        for out_key, column in stat_map.items():
            entry[out_key] = row.get(column)
        rows.append(entry)
    return rows


def get_shooting_leaders(players: pl.DataFrame) -> list[dict]:
    ranked = players.sort(["Gls", "G+A"], descending=[True, True]).head(LEADERBOARD_LIMIT)
    return _format(
        ranked,
        {
            "goals": "Gls",
            "goals_assists": "G+A",
            "shots": "Sh",
            "shots_on_target": "SoT",
            "shots_on_target_pct": "SoT%",
            "xg": "xG",
            "npxg": "npxG",
            "xag": "xAG",
        },
    )


def get_passing_leaders(players: pl.DataFrame) -> list[dict]:
    ranked = players.sort(["Ast", "Crs"], descending=[True, True]).head(LEADERBOARD_LIMIT)
    return _format(
        ranked,
        {
            "assists": "Ast",
            "crosses": "Crs",
            "cmp_pct": "Cmp%",
            "key_passes": "KP",
            "xa": "xA",
        },
    )


def get_match_leaders(players: pl.DataFrame) -> list[dict]:
    ranked = players.sort(["Min", "MP"], descending=[True, True]).head(LEADERBOARD_LIMIT)
    return _format(
        ranked,
        {"minutes": "Min", "matches_played": "MP", "starts": "Starts", "nineties": "90s"},
    )


def get_defending_leaders(players: pl.DataFrame) -> list[dict]:
    ranked = players.sort(["TklW", "Int"], descending=[True, True]).head(LEADERBOARD_LIMIT)
    return _format(
        ranked,
        {
            "tackles_won": "TklW",
            "interceptions": "Int",
            "clean_sheets": "CS",
            "clean_sheet_pct": "CS%",
            "tkl_pct": "Tkl%",
            "clearances": "Clr",
        },
    )


def get_discipline_leaders(players: pl.DataFrame) -> list[dict]:
    scored = players.with_columns(
        (pl.col("CrdR").fill_null(0) * 2 + pl.col("CrdY").fill_null(0)).alias("_card_score")
    )
    ranked = scored.sort(["_card_score", "Fls"], descending=[True, True]).head(LEADERBOARD_LIMIT)
    return _format(
        ranked,
        {
            "fouls_committed": "Fls",
            "fouls_drawn": "Fld",
            "yellow_cards": "CrdY",
            "red_cards": "CrdR",
            "second_yellow_cards": "2CrdY",
        },
    )


def get_leaderboards(players: pl.DataFrame) -> dict:
    return {
        "shooting": get_shooting_leaders(players),
        "passing": get_passing_leaders(players),
        "match": get_match_leaders(players),
        "defending": get_defending_leaders(players),
        "discipline": get_discipline_leaders(players),
    }

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

Keeping/Progression/Pass Accuracy/Possession/Creativity are the exception: their
whole premise is a detail-table stat (Saves, PrgP, Cmp%, Touches, SCA), so there's
no counting-stat substitute to sort by instead. _rank_and_format drops rows with a
null primary sort key so an unsupported season yields a clean empty list (rendered
as the leaderboard UI's existing "No data" state) rather than 100 null rows.

Keeping sorts by raw Saves (not Save%) so a keeper who played one match doesn't
outrank a season-long starter — same reasoning as goals/assists staying counting
stats above. Pass Accuracy is the one category that's still an inherent rate stat
(Cmp%), so it's the only one exposing the `qualified` (900+ minutes) filter.
"""

import polars as pl

from app.analytics.football_common import parse_code_name, split_positions

LEADERBOARD_LIMIT = 100
QUALIFIED_MIN_MINUTES = 900


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
            "minutes": row.get("Min"),
            "matches_played": row.get("MP"),
        }
        for out_key, column in stat_map.items():
            entry[out_key] = row.get(column)
        rows.append(entry)
    return rows


def _rank_and_format(
    df: pl.DataFrame,
    sort_cols: list[str],
    stat_map: dict[str, str],
    *,
    position: str | None = None,
    qualified: bool = False,
    min_minutes: int = QUALIFIED_MIN_MINUTES,
) -> list[dict]:
    scoped = df
    if position:
        scoped = scoped.filter(pl.col("Pos").str.contains(position, literal=True))
    if qualified:
        scoped = scoped.filter(pl.col("Min").fill_null(0) >= min_minutes)
    scoped = scoped.filter(pl.col(sort_cols[0]).is_not_null())
    ranked = scoped.sort(sort_cols, descending=[True] * len(sort_cols)).head(LEADERBOARD_LIMIT)
    return _format(ranked, stat_map)


def get_shooting_leaders(players: pl.DataFrame) -> list[dict]:
    return _rank_and_format(
        players,
        ["Gls", "G+A"],
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
    return _rank_and_format(
        players,
        ["Ast", "Crs"],
        {
            "assists": "Ast",
            "crosses": "Crs",
            "cmp_pct": "Cmp%",
            "key_passes": "KP",
            "xa": "xA",
        },
    )


def get_defending_leaders(players: pl.DataFrame) -> list[dict]:
    return _rank_and_format(
        players,
        ["TklW", "Int"],
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
    return _rank_and_format(
        scored,
        ["_card_score", "Fls"],
        {
            "fouls_committed": "Fls",
            "fouls_drawn": "Fld",
            "yellow_cards": "CrdY",
            "red_cards": "CrdR",
            "second_yellow_cards": "2CrdY",
        },
    )


def get_keeping_leaders(players: pl.DataFrame) -> list[dict]:
    return _rank_and_format(
        players,
        ["Saves"],
        {
            "saves": "Saves",
            "save_pct": "Save%",
            "clean_sheets": "CS",
            "clean_sheet_pct": "CS%",
            "psxg_diff": "PSxG+/-",
            "ga90": "GA90",
        },
        position="GK",
    )


def get_progression_leaders(players: pl.DataFrame) -> list[dict]:
    return _rank_and_format(
        players,
        ["PrgP", "PrgC"],
        {
            "prog_passes": "PrgP",
            "prog_carries": "PrgC",
            "prog_received": "PrgR",
            "prog_distance": "PrgDist",
        },
    )


def get_pass_accuracy_leaders(players: pl.DataFrame, qualified: bool = False) -> list[dict]:
    return _rank_and_format(
        players,
        ["Cmp%", "Cmp"],
        {
            "cmp_pct": "Cmp%",
            "passes_completed": "Cmp",
            "passes_attempted": "Att",
            "key_passes": "KP",
        },
        qualified=qualified,
    )


def get_possession_leaders(players: pl.DataFrame) -> list[dict]:
    return _rank_and_format(
        players,
        ["Touches", "Carries"],
        {
            "touches": "Touches",
            "carries": "Carries",
            "take_ons": "Succ",
            "take_on_pct": "Succ%",
        },
    )


def get_creativity_leaders(players: pl.DataFrame) -> list[dict]:
    return _rank_and_format(
        players,
        ["SCA", "GCA"],
        {
            "sca": "SCA",
            "sca90": "SCA90",
            "gca": "GCA",
            "gca90": "GCA90",
        },
    )


def get_leaderboards(players: pl.DataFrame, qualified: bool = False) -> dict:
    return {
        "shooting": get_shooting_leaders(players),
        "passing": get_passing_leaders(players),
        "defending": get_defending_leaders(players),
        "discipline": get_discipline_leaders(players),
        "keeping": get_keeping_leaders(players),
        "progression": get_progression_leaders(players),
        "pass_accuracy": get_pass_accuracy_leaders(players, qualified=qualified),
        "possession": get_possession_leaders(players),
        "creativity": get_creativity_leaders(players),
    }

"""Role-based scatter analysis: Top 25 per role, plotted as x/y stat pairs.

Unlike football_leaderboards.py (ranked tables, one stat), each chart here plots two
related stats against each other for the Top 25 players in a role — the kind of
quadrant chart that separates volume from quality (e.g. shot quality vs. goals scored)
rather than just ranking who has the most of one thing.

Same season-data caveat as football_leaderboards.py: charts built on detail-table
columns (npxG, xA, PrgP, PrgC, Cmp, Cmp%, PSxG+/-, Save%) are only populated for
seasons whose CSV merged in FBref's detail tables (currently just 2024-2025) — an
unsupported season yields a clean empty points list via the same null-drop pattern.
"""

import polars as pl

from app.analytics.football_common import YOUNG_AGE_MAX, humanize, split_positions

SCATTER_LIMIT = 25


def _scatter_points(
    df: pl.DataFrame,
    sort_col: str,
    x_col: str,
    y_col: str,
    *,
    position: str | None = None,
    limit: int = SCATTER_LIMIT,
) -> list[dict]:
    scoped = df
    if position:
        scoped = scoped.filter(pl.col("Pos").str.contains(position, literal=True))
    scoped = scoped.filter(pl.col(x_col).is_not_null() & pl.col(y_col).is_not_null())
    ranked = scoped.sort(sort_col, descending=True).head(limit)
    return [
        {
            "player_id": row["player_id"],
            "name": row["Player"],
            "team_id": row["team_id"],
            "team_name": row["Squad"],
            "positions": split_positions(row.get("Pos")),
            "age": row.get("Age"),
            "x": row.get(x_col),
            "y": row.get(y_col),
        }
        for row in ranked.iter_rows(named=True)
    ]


def _chart(df: pl.DataFrame, sort_col: str, x_col: str, y_col: str, *, position: str | None = None) -> dict:
    return {
        "title": f"Top {SCATTER_LIMIT} {humanize(x_col)} vs {humanize(y_col)}",
        "x_label": humanize(x_col),
        "y_label": humanize(y_col),
        "position": position,
        "points": _scatter_points(df, sort_col, x_col, y_col, position=position),
    }


def get_forward_finishing(players: pl.DataFrame) -> dict:
    return _chart(players, "Gls", "npxG", "Gls", position="FW")


def get_progressive_mid(players: pl.DataFrame) -> dict:
    return _chart(players, "PrgP", "PrgP", "PrgC", position="MF")


def get_assisting_mid(players: pl.DataFrame) -> dict:
    return _chart(players, "Ast", "xA", "Ast", position="MF")


def get_passers(players: pl.DataFrame) -> dict:
    return _chart(players, "Cmp", "Cmp", "Cmp%")


def get_defenders(players: pl.DataFrame) -> dict:
    scored = players.with_columns(
        (pl.col("TklW").fill_null(0) + pl.col("Int").fill_null(0)).alias("_defense_score")
    )
    return _chart(scored, "_defense_score", "TklW", "Int", position="DF")


def get_keepers(players: pl.DataFrame) -> dict:
    return _chart(players, "Saves", "Save%", "PSxG+/-", position="GK")


def get_analysis_charts(players: pl.DataFrame, young: bool = False) -> dict:
    if young:
        players = players.filter(pl.col("Age") <= YOUNG_AGE_MAX)
    return {
        "forwards": get_forward_finishing(players),
        "progressive_mids": get_progressive_mid(players),
        "assisting_mids": get_assisting_mid(players),
        "passers": get_passers(players),
        "defenders": get_defenders(players),
        "keepers": get_keepers(players),
    }

"""Similar-players lookup for a player's detail page.

Ranks same-primary-position players by Euclidean distance in z-score space over the
curated POSITION_RADAR_STATS feature set (the same 8-stat-per-position list that
drives radar charts), then splits the distance-ranked list into an age-agnostic
"similar" bucket and an age<=23 "young" bucket. Reuses the null-drop-per-season
pattern established in football_analysis.py: the 2025-2026 CSV lacks most detail-table
columns, so the feature vector is trimmed to whichever radar stats are actually
non-null for the target player, and candidates missing any of those stats are dropped
from the pool rather than crashing or skewing the distance calculation with nulls.

The response also carries the target player's own 5-stat summary (`player`) alongside
`similar`/`young`, built from the separate, shorter POSITION_CARD_STATS list (not the
8-stat radar list) so the same compact card can render "this is you" next to the
suggestions. It's computed unconditionally once a primary position is known — unlike
the similarity ranking, it doesn't depend on feature-column availability, so it's
still populated even when the season is too sparse to rank candidates at all.
"""

import polars as pl

from app.analytics.football_common import (
    POSITION_CARD_STATS,
    POSITION_RADAR_STATS,
    YOUNG_AGE_MAX,
    humanize,
    split_positions,
)

SIMILAR_COUNT = 3
YOUNG_COUNT = 2


def _feature_columns(position: str, target_row: dict) -> list[str]:
    return [key for key in POSITION_RADAR_STATS.get(position, []) if target_row.get(key) is not None]


def _rank_candidates(players: pl.DataFrame, target_row: dict, position: str, feature_cols: list[str]) -> pl.DataFrame:
    pool = players.filter(
        (pl.col("season") == target_row["season"])
        & pl.col("Pos").str.contains(position, literal=True)
        & (pl.col("player_id") != target_row["player_id"])
    )
    for col in feature_cols:
        pool = pool.filter(pl.col(col).is_not_null())
    if pool.is_empty():
        return pool

    distance_expr = pl.lit(0.0)
    used_any = False
    for col in feature_cols:
        mean = pool[col].mean()
        std = pool[col].std()
        if not std:
            continue
        target_z = (target_row[col] - mean) / std
        distance_expr = distance_expr + ((pl.col(col) - mean) / std - target_z) ** 2
        used_any = True

    distance = distance_expr.sqrt() if used_any else pl.lit(0.0)
    return pool.with_columns(distance.alias("_distance")).sort("_distance")


def _summarize(row: dict, position: str) -> dict:
    stat_keys = POSITION_CARD_STATS.get(position, [])
    return {
        "player_id": row["player_id"],
        "name": row["Player"],
        "age": row.get("Age"),
        "positions": split_positions(row.get("Pos")),
        "team_id": row["team_id"],
        "team_name": row["Squad"],
        "stats": [{"key": key, "label": humanize(key), "value": row.get(key)} for key in stat_keys],
    }


def get_similar_players(players: pl.DataFrame, player_id: str, *, season: str | None = None) -> dict | None:
    scoped = players.filter(pl.col("season") == season) if season else players
    matches = scoped.filter(pl.col("player_id") == player_id)
    if matches.is_empty():
        return None

    target_row = matches.row(0, named=True)
    positions = split_positions(target_row.get("Pos"))
    if not positions:
        return {"player": None, "similar": [], "young": []}
    position = positions[0]
    own_summary = _summarize(target_row, position)

    feature_cols = _feature_columns(position, target_row)
    if not feature_cols:
        return {"player": own_summary, "similar": [], "young": []}

    ranked = _rank_candidates(players, target_row, position, feature_cols)
    if ranked.is_empty():
        return {"player": own_summary, "similar": [], "young": []}

    similar_rows = ranked.head(SIMILAR_COUNT)
    similar_ids = set(similar_rows["player_id"].to_list())
    similar = [_summarize(row, position) for row in similar_rows.iter_rows(named=True)]

    # Excludes anyone already placed in `similar` — a closest-match candidate who's also
    # <=23 would otherwise be picked for both buckets, rendering as a duplicate comp card.
    young_rows = ranked.filter((pl.col("Age") <= YOUNG_AGE_MAX) & ~pl.col("player_id").is_in(similar_ids)).head(
        YOUNG_COUNT
    )
    young = [_summarize(row, position) for row in young_rows.iter_rows(named=True)]

    return {"player": own_summary, "similar": similar, "young": young}

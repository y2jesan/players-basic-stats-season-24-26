"""Player profile + stat-card grouping for the real 2025/26 dataset."""

import math
from collections import defaultdict

import polars as pl

from app.analytics.football_common import (
    CARD_ORDER,
    IDENTITY_BASES,
    POSITION_RADAR_STATS,
    TYPE_LABELS,
    canonical_key,
    humanize,
    is_advanced,
    is_blank,
    is_negative_stat,
    parse_code_name,
    split_positions,
    stat_sort_key,
)

NON_STAT_COLUMNS = {
    "Player",
    "Squad",
    "player_id",
    "team_id",
    "season",
    "competition_id",
    "competition_name",
    "competition_country_code",
    "nationality_code",
    "nationality_name",
}


def _dedup_stats(row: dict, stat_type_map: dict[str, str]) -> list[dict]:
    """Collapse duplicated metric columns into one stat each.

    Columns are grouped by their canonical (suffix-stripped) key. Within a group, a
    column's declared stat-type.json `type` can genuinely differ from the rest (e.g.
    PKatt_stats_keeper is "penalties faced by a keeper", type `keeping`, not a duplicate
    of PKatt/PKatt_stats_shooting which are "penalties taken", type `shooting`) — such
    columns are kept as their own stat, keyed by their original column name, rather than
    silently merged away. Purely-null values are dropped so a card can omit itself when
    it ends up with zero stats (e.g. no "Keeping" card for outfield players).
    """
    groups: dict[str, list[str]] = defaultdict(list)
    for column in row:
        if column in NON_STAT_COLUMNS:
            continue
        base = canonical_key(column)
        if base in IDENTITY_BASES:
            continue
        groups[base].append(column)

    stats = []
    for canonical, columns in groups.items():
        by_type: dict[str, list[str]] = defaultdict(list)
        for column in columns:
            by_type[stat_type_map[column]].append(column)
        primary_type = stat_type_map[columns[0]]

        for stat_type, type_columns in by_type.items():
            source_column = next((c for c in type_columns if not is_blank(row[c])), None)
            if source_column is None:
                continue
            key = canonical if stat_type == primary_type else type_columns[0]
            stats.append(
                {
                    "key": key,
                    "label": humanize(key),
                    "type": stat_type,
                    "value": row[source_column],
                    "advanced": is_advanced(key),
                    "_column": source_column,
                }
            )

    return stats


def _group_into_cards(stats: list[dict]) -> list[dict]:
    by_type: dict[str, list[dict]] = defaultdict(list)
    for stat in stats:
        by_type[stat["type"]].append(stat)

    cards = []
    for stat_type in CARD_ORDER:
        type_stats = by_type.get(stat_type)
        if not type_stats:
            continue
        cards.append(
            {
                "type": stat_type,
                "label": TYPE_LABELS.get(stat_type, stat_type.title()),
                "stats": sorted(type_stats, key=stat_sort_key),
            }
        )
    return cards


def _numeric(value) -> float | None:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    return float(value)


def _percentile_for(scope_df: pl.DataFrame, column: str, key: str, value) -> int | None:
    numeric_value = _numeric(value)
    if numeric_value is None or column not in scope_df.columns:
        return None

    values = scope_df[column].drop_nulls()
    total = values.len()
    if total == 0:
        return None

    count = (values >= numeric_value).sum() if is_negative_stat(key) else (values <= numeric_value).sum()
    return math.ceil(count / total * 100)


def _attach_percentiles(stats: list[dict], *, league_df: pl.DataFrame, overall_df: pl.DataFrame) -> None:
    for stat in stats:
        column = stat.pop("_column")
        stat["league_percentile"] = _percentile_for(league_df, column, stat["key"], stat["value"])
        stat["overall_percentile"] = _percentile_for(overall_df, column, stat["key"], stat["value"])


def _build_radar_charts(stats: list[dict], players: pl.DataFrame, row: dict) -> list[dict]:
    """One radar per listed position, each axis percentiled against players who share it.

    Must run before _attach_percentiles pops `_column` off each stat, since the
    position-scoped percentile here is computed independently of (and in addition to)
    the season/league percentiles _attach_percentiles adds.
    """
    stats_by_key = {s["key"]: s for s in stats}
    season_df = players.filter(pl.col("season") == row["season"])
    charts = []
    for position in split_positions(row.get("Pos")):
        axis_keys = POSITION_RADAR_STATS.get(position)
        if not axis_keys:
            continue
        position_df = season_df.filter(pl.col("Pos").str.contains(position, literal=True))
        axes = []
        for key in axis_keys:
            stat = stats_by_key.get(key)
            if stat is None:
                axes.append({"key": key, "label": humanize(key), "value": None, "percentile": None})
                continue
            axes.append(
                {
                    "key": key,
                    "label": stat["label"],
                    "value": stat["value"],
                    "percentile": _percentile_for(position_df, stat["_column"], key, stat["value"]),
                }
            )
        charts.append({"position": position, "sample_size": position_df.height, "axes": axes})
    return charts


def _build_profile(row: dict) -> dict:
    return {
        "player_id": row["player_id"],
        "name": row["Player"],
        "nation": parse_code_name(row.get("Nation")),
        "positions": split_positions(row.get("Pos")),
        "age": row.get("Age"),
        "born": row.get("Born"),
        "team_id": row["team_id"],
        "team_name": row["Squad"],
        "competition": parse_code_name(row.get("Comp")),
        "season": row["season"],
    }


def get_player_detail(
    players: pl.DataFrame, stat_type_map: dict[str, str], player_id: str, *, season: str | None = None
) -> dict | None:
    scoped = players.filter(pl.col("season") == season) if season else players
    matches = scoped.filter(pl.col("player_id") == player_id)
    if matches.is_empty():
        return None

    row = matches.row(0, named=True)
    stats = _dedup_stats(row, stat_type_map)
    radar_charts = _build_radar_charts(stats, players, row)

    overall_df = players.filter(pl.col("season") == row["season"])
    league_df = overall_df.filter(pl.col("competition_id") == row["competition_id"])
    _attach_percentiles(stats, league_df=league_df, overall_df=overall_df)

    return {"profile": _build_profile(row), "cards": _group_into_cards(stats), "radar_charts": radar_charts}


def search_players(players: pl.DataFrame, query: str, season: str | None, limit: int = 10) -> list[dict]:
    scoped = players.filter(pl.col("season") == season) if season else players
    if not query or not query.strip():
        return []
    matches = scoped.filter(pl.col("Player").str.to_lowercase().str.contains(query.strip().lower(), literal=True))
    return [
        {
            "player_id": row["player_id"],
            "name": row["Player"],
            "team_id": row["team_id"],
            "team_name": row["Squad"],
            "positions": split_positions(row.get("Pos")),
        }
        for row in matches.head(limit).iter_rows(named=True)
    ]

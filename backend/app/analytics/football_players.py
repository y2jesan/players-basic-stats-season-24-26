"""Player profile + stat-card grouping for the real 2025/26 dataset."""

from collections import defaultdict

import polars as pl

from app.analytics.football_common import (
    CARD_ORDER,
    IDENTITY_BASES,
    TYPE_LABELS,
    canonical_key,
    humanize,
    is_advanced,
    is_blank,
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
            value = next((row[c] for c in type_columns if not is_blank(row[c])), None)
            if value is None:
                continue
            key = canonical if stat_type == primary_type else type_columns[0]
            stats.append(
                {
                    "key": key,
                    "label": humanize(key),
                    "type": stat_type,
                    "value": value,
                    "advanced": is_advanced(key),
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


def get_player_detail(players: pl.DataFrame, stat_type_map: dict[str, str], player_id: str) -> dict | None:
    matches = players.filter(pl.col("player_id") == player_id)
    if matches.is_empty():
        return None

    row = matches.row(0, named=True)
    stats = _dedup_stats(row, stat_type_map)
    return {"profile": _build_profile(row), "cards": _group_into_cards(stats)}

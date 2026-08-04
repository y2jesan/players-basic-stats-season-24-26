"""Team list + team detail for the real 2025/26 dataset — grouped from player rows.

There is no match/fixture data in this dataset, so teams have no wins/draws/losses/
points — only aggregates derivable from their players (goals, assists, cards, age).
"""

import polars as pl

from app.analytics.football_common import parse_code_name, split_positions


def list_teams(players: pl.DataFrame, *, competition: str | None = None) -> pl.DataFrame:
    df = players
    if competition:
        df = df.filter(pl.col("competition_id") == competition)

    return (
        df.group_by("team_id")
        .agg(
            pl.col("Squad").first().alias("name"),
            pl.col("competition_id").first().alias("competition"),
            pl.col("competition_name").first().alias("competition_name"),
            pl.col("competition_country_code").first().alias("country"),
            pl.len().alias("player_count"),
            pl.col("Gls").sum().alias("total_goals"),
            pl.col("Ast").sum().alias("total_assists"),
            pl.col("Age").mean().round(1).alias("avg_age"),
            pl.col("CrdY").sum().alias("total_yellow_cards"),
            pl.col("CrdR").sum().alias("total_red_cards"),
        )
        .sort("name")
    )


def get_team_detail(players: pl.DataFrame, team_id: str, *, season: str | None = None) -> dict | None:
    scoped = players.filter(pl.col("season") == season) if season else players
    team_rows = scoped.filter(pl.col("team_id") == team_id)
    if team_rows.is_empty():
        return None

    first = team_rows.row(0, named=True)
    team = {
        "team_id": team_id,
        "name": first["Squad"],
        "competition": parse_code_name(first["Comp"]),
        "player_count": team_rows.height,
        "season": first["season"],
    }

    roster = []
    for row in team_rows.sort("Player").iter_rows(named=True):
        roster.append(
            {
                "player_id": row["player_id"],
                "name": row["Player"],
                "positions": split_positions(row.get("Pos")),
                "nationality": parse_code_name(row.get("Nation")),
                "age": row.get("Age"),
                "appearances": row.get("MP"),
                "goals": row.get("Gls"),
                "assists": row.get("Ast"),
                "yellow_cards": row.get("CrdY"),
                "red_cards": row.get("CrdR"),
            }
        )

    return {"team": team, "players": roster}

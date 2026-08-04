"""Country detail (players of a given nationality) for the real 2025/26 dataset."""

import polars as pl

from app.analytics.football_common import parse_code_name, split_positions


def get_country_detail(players: pl.DataFrame, country_code: str) -> dict | None:
    country_rows = players.filter(pl.col("nationality_code") == country_code)
    if country_rows.is_empty():
        return None

    first = country_rows.row(0, named=True)
    country = {
        "code": country_code,
        "name": first["nationality_name"],
        "player_count": country_rows.height,
    }

    players_out = []
    for row in country_rows.sort("Player").iter_rows(named=True):
        players_out.append(
            {
                "player_id": row["player_id"],
                "name": row["Player"],
                "positions": split_positions(row.get("Pos")),
                "team_id": row["team_id"],
                "team_name": row["Squad"],
                "competition": parse_code_name(row.get("Comp")),
                "age": row.get("Age"),
                "appearances": row.get("MP"),
                "goals": row.get("Gls"),
                "assists": row.get("Ast"),
                "yellow_cards": row.get("CrdY"),
                "red_cards": row.get("CrdR"),
            }
        )

    return {"country": country, "players": players_out}

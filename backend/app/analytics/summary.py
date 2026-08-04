"""Pure Polars functions computing aggregate stats for the dashboard/analysis summary card row."""

import polars as pl


def compute_summary(
    teams: pl.DataFrame, players: pl.DataFrame, matches: pl.DataFrame
) -> dict:
    total_goals = int((matches["home_score"] + matches["away_score"]).sum())
    avg_goals_per_match = (
        round(total_goals / matches.height, 2) if matches.height else 0.0
    )

    top_scorer_row = players.sort("goals", descending=True).row(0, named=True)

    return {
        "total_teams": teams.height,
        "total_players": players.height,
        "total_matches": matches.height,
        "total_goals": total_goals,
        "avg_goals_per_match": avg_goals_per_match,
        "top_scorer": {
            "player_id": top_scorer_row["player_id"],
            "name": top_scorer_row["name"],
            "team_name": top_scorer_row["team_name"],
            "goals": top_scorer_row["goals"],
        },
    }

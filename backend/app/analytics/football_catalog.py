"""Season/competition/country catalog + dashboard summary for the real 2025/26 dataset."""

import polars as pl

from app.analytics.football_common import CARD_ORDER


def list_seasons(players: pl.DataFrame) -> list[dict]:
    seasons = players["season"].unique().sort().to_list()
    return [{"id": season, "label": season.replace("-", "/")} for season in seasons]


def list_competitions(players: pl.DataFrame, *, season: str | None = None) -> list[dict]:
    df = players
    if season:
        df = df.filter(pl.col("season") == season)

    grouped = (
        df.group_by("competition_id")
        .agg(
            pl.col("competition_name").first().alias("name"),
            pl.col("competition_country_code").first().alias("country_code"),
            pl.col("team_id").n_unique().alias("team_count"),
            pl.len().alias("player_count"),
        )
        .sort("name")
    )
    return grouped.to_dicts()


def list_countries(
    players: pl.DataFrame, *, season: str | None = None, competition: str | None = None
) -> list[dict]:
    df = players
    if season:
        df = df.filter(pl.col("season") == season)
    if competition:
        df = df.filter(pl.col("competition_id") == competition)
    df = df.filter(pl.col("nationality_code").is_not_null())

    grouped = (
        df.group_by("nationality_code")
        .agg(
            pl.col("nationality_name").first().alias("name"),
            pl.len().alias("player_count"),
            pl.col("Gls").sum().alias("total_goals"),
            pl.col("Ast").sum().alias("total_assists"),
            pl.col("Age").mean().round(1).alias("avg_age"),
            pl.col("CrdY").sum().alias("total_yellow_cards"),
            pl.col("CrdR").sum().alias("total_red_cards"),
        )
        .rename({"nationality_code": "code"})
        .sort("name")
    )
    return grouped.to_dicts()


GLOSSARY_TYPE_ORDER = ["player", "squad", *CARD_ORDER]


def list_stat_glossary(raw: pl.DataFrame) -> list[dict]:
    """Every stat-type.json row (including source-table duplicates) with its description.

    Kept un-deduplicated on purpose: a rendered table column maps to one exact CSV property
    key (e.g. "CS" specifically), so header-tooltip lookups need every raw key present.
    """
    rows = raw.to_dicts()
    rank = {t: i for i, t in enumerate(GLOSSARY_TYPE_ORDER)}
    rows.sort(key=lambda r: (rank.get(r["type"], len(GLOSSARY_TYPE_ORDER)), r["property"]))
    return rows


def compute_dashboard_summary(
    players: pl.DataFrame, *, season: str | None = None, competition: str | None = None
) -> dict:
    season_df = players.filter(pl.col("season") == season) if season else players
    scoped_df = season_df.filter(pl.col("competition_id") == competition) if competition else season_df

    return {
        "total_competitions": season_df["competition_id"].n_unique(),
        "total_teams": scoped_df["team_id"].n_unique(),
        "total_players": scoped_df.height,
        "total_countries": len(list_countries(scoped_df)),
        "total_goals": int(scoped_df["Gls"].sum() or 0),
        "total_assists": int(scoped_df["Ast"].sum() or 0),
    }

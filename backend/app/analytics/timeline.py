"""Pure Polars function shaping match data into a monthly time series for Recharts."""

import polars as pl

MONTH_LABELS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
]


def compute_timeline(matches: pl.DataFrame) -> pl.DataFrame:
    """One row per month played: total goals and match count, ordered chronologically."""
    return (
        matches.with_columns(
            pl.col("date").str.slice(5, 2).cast(pl.Int32).alias("month_num"),
            (pl.col("home_score") + pl.col("away_score")).alias("goals"),
        )
        .group_by("month_num")
        .agg(pl.col("goals").sum(), pl.len().alias("matches"))
        .sort("month_num")
        .with_columns(
            pl.col("month_num")
            .map_elements(lambda m: MONTH_LABELS[m - 1], return_dtype=pl.Utf8)
            .alias("month")
        )
        .select("month", "goals", "matches")
    )

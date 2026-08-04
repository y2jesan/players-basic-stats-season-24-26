"""Pure Polars functions for the players endpoint. DataFrame in, DataFrame/tuple out."""

import polars as pl

SORTABLE_COLUMNS = {
    "name",
    "team_name",
    "position",
    "nationality",
    "age",
    "appearances",
    "goals",
    "assists",
    "xg",
    "yellow_cards",
    "red_cards",
    "shirt_number",
}


def paginate_players(
    df: pl.DataFrame,
    *,
    page: int,
    page_size: int,
    sort: str | None = None,
    order: str = "asc",
    q: str | None = None,
    position: str | None = None,
) -> tuple[pl.DataFrame, int]:
    """Filters, sorts, and paginates the players table. Returns (page_rows, total_matching)."""
    if q:
        df = df.filter(pl.col("name").str.to_lowercase().str.contains(q.lower()))
    if position:
        df = df.filter(pl.col("position") == position)

    total = df.height

    if sort in SORTABLE_COLUMNS:
        df = df.sort(sort, descending=(order == "desc"))

    start = (page - 1) * page_size
    return df.slice(start, page_size), total

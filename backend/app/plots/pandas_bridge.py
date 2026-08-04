"""The only place a Polars DataFrame becomes a Pandas one — mplsoccer expects Pandas, so plot
builders convert here at the boundary. Every other transform in the app stays in Polars."""

import pandas as pd
import polars as pl


def to_pandas(df: pl.DataFrame) -> pd.DataFrame:
    return df.to_pandas()

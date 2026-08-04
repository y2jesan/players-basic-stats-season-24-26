"""Positional heatmap: pure function, touch-location data in, a matplotlib Figure out."""

import polars as pl
from matplotlib.colors import LinearSegmentedColormap
from mplsoccer import Pitch

from app.plots.pandas_bridge import to_pandas
from app.plots.theme import CHART_COLORS, PITCH_BACKGROUND_COLOR, PITCH_LINE_COLOR


def build_heatmap(touches: pl.DataFrame, title: str):
    df = to_pandas(touches)

    pitch = Pitch(
        pitch_type="statsbomb",
        pitch_color=PITCH_BACKGROUND_COLOR,
        line_color=PITCH_LINE_COLOR,
        half=False,
    )
    fig, ax = pitch.draw(figsize=(10, 7))
    fig.suptitle(title, fontsize=14, fontweight="bold")

    bin_stat = pitch.bin_statistic(df["x"], df["y"], statistic="count", bins=(24, 16))
    cmap = LinearSegmentedColormap.from_list(
        "theme_heat", [PITCH_BACKGROUND_COLOR, *CHART_COLORS]
    )
    pitch.heatmap(bin_stat, ax=ax, cmap=cmap, edgecolors=PITCH_BACKGROUND_COLOR)

    return fig

"""Shot map: pure function, shot data in, a matplotlib Figure out. Never touches the filesystem."""

import polars as pl
from mplsoccer import Pitch

from app.plots.pandas_bridge import to_pandas
from app.plots.theme import (
    CHART_1_HEX,
    PITCH_BACKGROUND_COLOR,
    PITCH_LINE_COLOR,
    PRIMARY_HEX,
)


def build_shot_map(shots: pl.DataFrame, title: str):
    df = to_pandas(shots)

    pitch = Pitch(
        pitch_type="statsbomb",
        pitch_color=PITCH_BACKGROUND_COLOR,
        line_color=PITCH_LINE_COLOR,
        half=False,
    )
    fig, ax = pitch.draw(figsize=(10, 7))
    fig.suptitle(title, fontsize=14, fontweight="bold")

    goals = df[df["outcome"] == "Goal"]
    others = df[df["outcome"] != "Goal"]

    pitch.scatter(
        others["x"],
        others["y"],
        s=others["xg"] * 400 + 40,
        c=CHART_1_HEX,
        edgecolors=PITCH_LINE_COLOR,
        alpha=0.7,
        ax=ax,
        label="Shot",
    )
    pitch.scatter(
        goals["x"],
        goals["y"],
        s=goals["xg"] * 400 + 60,
        c=PRIMARY_HEX,
        edgecolors=PITCH_LINE_COLOR,
        alpha=0.9,
        marker="*",
        ax=ax,
        label="Goal",
    )
    ax.legend(loc="upper left", fontsize=9, frameon=False)

    return fig

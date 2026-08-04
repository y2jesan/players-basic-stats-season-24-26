"""The one place matplotlib is configured for headless rendering. Import this before pyplot
anywhere else in the app, and never call pyplot directly outside `plots/`."""

import matplotlib

matplotlib.use("Agg")

from io import BytesIO

from matplotlib import pyplot as plt
from matplotlib.figure import Figure

DPI = 150


def render_png(fig: Figure) -> bytes:
    """Serializes a Figure to PNG bytes and always closes it, even on error."""
    try:
        buffer = BytesIO()
        fig.savefig(buffer, format="png", dpi=DPI, bbox_inches="tight")
        return buffer.getvalue()
    finally:
        plt.close(fig)

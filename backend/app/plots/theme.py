"""Plot colours, hardcoded to mirror the frontend palette so PNGs match the UI.

Source of truth: frontend/src/styles/globals.css (the `--primary` and `--chart-1..5` oklch
tokens). These are a one-time manual conversion to hex — re-derive them here if that file changes.
"""

PRIMARY_HEX = "#007a55"
CHART_1_HEX = "#5ee9b5"
CHART_2_HEX = "#00bc7d"
CHART_3_HEX = "#009966"
CHART_4_HEX = "#007a55"
CHART_5_HEX = "#006045"

CHART_COLORS = [CHART_1_HEX, CHART_2_HEX, CHART_3_HEX, CHART_4_HEX, CHART_5_HEX]

PITCH_LINE_COLOR = "#3f3f46"
PITCH_BACKGROUND_COLOR = "#ffffff"

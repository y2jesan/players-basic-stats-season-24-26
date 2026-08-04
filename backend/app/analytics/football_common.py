"""Shared parsing/labeling helpers for the real 2025/26 dataset.

The CSV is a horizontal merge of 5 FBref-style stat tables, so identity columns (Rk,
Nation, Pos, Comp, Age, Born) appear once unsuffixed and again per source table, suffixed
_stats_keeper / _stats_shooting / _stats_playing_time / _stats_misc. A handful of real
metrics (90s, MP, Gls, ...) are duplicated the same way because they exist in more than
one source table.
"""

import re
import unicodedata

IDENTITY_BASES = {"Rk", "Nation", "Pos", "Comp", "Age", "Born"}
DUP_SUFFIXES = ("_stats_keeper", "_stats_shooting", "_stats_playing_time", "_stats_misc")

TYPE_LABELS = {
    "match": "Match",
    "shooting": "Shooting",
    "passing": "Passing",
    "decipline": "Discipline",
    "keeping": "Keeping",
    "defending": "Defending",
    "others": "Others",
}
CARD_ORDER = ["match", "shooting", "passing", "decipline", "keeping", "defending", "others"]

STAT_LABELS = {
    "MP": "Matches Played",
    "Starts": "Starts",
    "Min": "Minutes Played",
    "90s": "Nineties Played",
    "Gls": "Goals",
    "Ast": "Assists",
    "G+A": "Goals + Assists",
    "G-PK": "Non-Penalty Goals",
    "PK": "Penalty Goals",
    "PKatt": "Penalty Kicks Attempted",
    "PKatt_stats_keeper": "Penalty Kicks Faced",
    "CrdY": "Yellow Cards",
    "CrdR": "Red Cards",
    "2CrdY": "Second Yellow Cards",
    "G+A-PK": "Non-Penalty Goals + Assists",
    "GA": "Goals Against",
    "GA90": "Goals Against / 90",
    "SoTA": "Shots on Target Against",
    "Saves": "Saves",
    "Save%": "Save %",
    "W": "Wins",
    "D": "Draws",
    "L": "Losses",
    "CS": "Clean Sheets",
    "CS%": "Clean Sheet %",
    "PKA": "Penalty Kicks Allowed",
    "PKsv": "Penalty Kicks Saved",
    "PKm": "Penalty Kicks Missed (Faced)",
    "Sh": "Shots",
    "SoT": "Shots on Target",
    "SoT%": "Shots on Target %",
    "Sh/90": "Shots / 90",
    "SoT/90": "Shots on Target / 90",
    "G/Sh": "Goals per Shot",
    "G/SoT": "Goals per Shot on Target",
    "Mn/MP": "Minutes per Match",
    "Min%": "Minutes % of Squad",
    "Mn/Start": "Minutes per Start",
    "Compl": "Complete Matches",
    "Subs": "Substitute Appearances",
    "Mn/Sub": "Minutes per Substitution",
    "unSub": "Unused Substitute",
    "PPM": "Points per Match",
    "onG": "Goals Scored On Pitch",
    "onGA": "Goals Conceded On Pitch",
    "+/-": "Plus/Minus",
    "+/-90": "Plus/Minus / 90",
    "On-Off": "On-Off Rating",
    "Fls": "Fouls Committed",
    "Fld": "Fouls Drawn",
    "Off": "Offsides",
    "Crs": "Crosses",
    "Int": "Interceptions",
    "TklW": "Tackles Won",
    "OG": "Own Goals",
}


def canonical_key(column: str) -> str:
    for suffix in DUP_SUFFIXES:
        if column.endswith(suffix):
            return column[: -len(suffix)]
    return column


def humanize(key: str) -> str:
    if key in STAT_LABELS:
        return STAT_LABELS[key]
    base = canonical_key(key)
    if base in STAT_LABELS:
        return STAT_LABELS[base]
    spaced = re.sub(r"(?<!^)(?=[A-Z])", " ", key)
    return spaced.replace("_", " ").replace("-", " ").strip().title()


def parse_code_name(raw: str | None) -> dict | None:
    if not raw or not raw.strip():
        return None
    parts = raw.strip().split(" ", 1)
    if len(parts) != 2:
        return {"code": raw.strip().lower(), "name": raw.strip()}
    code, name = parts
    return {"code": code.lower(), "name": name}


def split_positions(raw: str | None) -> list[str]:
    if not raw or not raw.strip():
        return []
    return [p.strip() for p in raw.split(",") if p.strip()]


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-zA-Z0-9]+", "-", normalized).strip("-").lower()


def is_blank(value) -> bool:
    if value is None:
        return True
    return bool(isinstance(value, str) and not value.strip())

"""Shared parsing/labeling helpers for the real multi-season dataset.

Each season's CSV is a horizontal merge of several FBref-style stat tables, so identity
columns (Rk, Nation, Pos, Comp, Age, Born) appear once unsuffixed and again per source
table, suffixed by DUP_SUFFIXES. A handful of real metrics (90s, MP, Gls, xG, ...) are
duplicated the same way because they exist in more than one source table. The 2025-2026
season's CSV only merges 5 tables (standard, shooting, keeper, playing time, misc); the
2024-2025 season's CSV merges 11 (also passing, passing types, goal/shot creation,
defense, possession, advanced keeper), so it alone carries real xG/xAG/passing-detail
data — 2025-2026's rows are simply null for those columns after the two seasons are
concatenated, which the null-dropping in football_players._dedup_stats already handles.
"""

import re
import unicodedata

IDENTITY_BASES = {"Rk", "Nation", "Pos", "Comp", "Age", "Born"}
DUP_SUFFIXES = (
    "_stats_keeper_adv",
    "_stats_passing_types",
    "_stats_keeper",
    "_stats_shooting",
    "_stats_playing_time",
    "_stats_misc",
    "_stats_passing",
    "_stats_gca",
    "_stats_defense",
    "_stats_possession",
)

TYPE_LABELS = {
    "match": "Match",
    "shooting": "Shooting",
    "passing": "Passing",
    "creation": "Creation",
    "possession": "Possession",
    "decipline": "Discipline",
    "keeping": "Keeping",
    "defending": "Defending",
    "others": "Misc",
}
CARD_ORDER = [
    "match",
    "shooting",
    "passing",
    "creation",
    "possession",
    "decipline",
    "keeping",
    "defending",
    "others",
]

# Advanced/expected-value stats worth visually highlighting wherever they're shown
# (player stat cards, leaderboard column headers) — real-world quality/luck-adjusted
# metrics rather than plain counting stats. Only present for seasons whose CSV was
# merged with the FBref passing/shooting/gca/keeper_adv detail tables.
ADVANCED_STAT_KEYS = {
    "xG",
    "npxG",
    "xAG",
    "xA",
    "npxG+xAG",
    "xG+xAG",
    "G-xG",
    "np:G-xG",
    "GCA",
    "GCA90",
    "SCA",
    "SCA90",
    "PSxG",
    "PSxG/SoT",
    "PSxG+/-",
    "/90",
    "onxG",
    "onxGA",
    "xG+/-",
    "xG+/-90",
}

# Stats where a *lower* raw value is actually the better outcome (cards, fouls
# committed, goals/shots conceded, errors, ...). Percentile computation inverts the
# rank for these so fewer = a higher (greener) percentile, keeping green-is-good/
# red-is-bad consistent across every stat rather than only rewarding bigger numbers.
NEGATIVE_STAT_KEYS = {
    "CrdY",
    "CrdR",
    "2CrdY",
    "Fls",
    "Off",
    "OG",
    "GA",
    "GA90",
    "SoTA",
    "PKA",
    "Mis",
    "Dis",
    "Err",
    "PKcon",
    "Lost",
    "Lost_stats_misc",
}

# Within a card, stats listed here surface first (in this order); everything else
# falls back to alphabetical. Order is chosen per-card, not globally, since each key
# only ever appears in one card.
PRIORITY_STATS = [
    "MP",
    "Min",
    "Gls",
    "xG",
    "npxG",
    "Ast",
    "xAG",
    "xA",
    "Sh",
    "SoT",
    "PK",
    "PKatt",
    "GCA",
    "SCA",
    "CrdY",
    "CrdR",
    "Fls",
    "Fld",
    "TklW",
    "Int",
    "Saves",
    "PSxG",
    "GA",
    "CS",
]
_PRIORITY_RANK = {key: rank for rank, key in enumerate(PRIORITY_STATS)}

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
    # --- xG-family / expected-value stats ---
    "xG": "Expected Goals",
    "npxG": "Non-Penalty xG",
    "xAG": "Expected Assisted Goals",
    "npxG+xAG": "npxG + xAG",
    "xG+xAG": "xG + xAG",
    "G-xG": "Goals Minus xG",
    "np:G-xG": "Non-Penalty Goals Minus npxG",
    "xA": "Expected Assists",
    "A-xAG": "Assists Minus xAG",
    "onxG": "xG Scored On Pitch",
    "onxGA": "xG Conceded On Pitch",
    "xG+/-": "xG Plus/Minus",
    "xG+/-90": "xG Plus/Minus / 90",
    "PSxG": "Post-Shot Expected Goals",
    "PSxG/SoT": "PSxG per Shot on Target",
    "PSxG+/-": "PSxG Plus/Minus",
    "/90": "PSxG Plus/Minus / 90",
    # --- shooting detail ---
    "Dist": "Average Shot Distance",
    "npxG/Sh": "npxG per Shot",
    # --- progression ---
    "PrgC": "Progressive Carries",
    "PrgP": "Progressive Passes",
    "PrgR": "Progressive Passes Received",
    # --- passing detail ---
    "Cmp": "Passes Completed",
    "Att": "Passes Attempted",
    "Cmp%": "Pass Completion %",
    "TotDist": "Total Passing Distance",
    "PrgDist": "Progressive Passing Distance",
    "KP": "Key Passes",
    "1/3": "Passes into Final Third",
    "PPA": "Passes into Penalty Area",
    "CrsPA": "Crosses into Penalty Area",
    # --- pass types ---
    "Live": "Live-Ball Passes",
    "Dead": "Dead-Ball Passes",
    "TB": "Through Balls",
    "Sw": "Switches",
    "TI": "Throw-Ins Taken",
    "CK": "Corner Kicks Taken",
    "In": "Inswinging Corners",
    "Out": "Outswinging Corners",
    "Str": "Straight Corners",
    "Blocks": "Passes Blocked (by Opponent)",
    # --- shot/goal creation ---
    "SCA": "Shot-Creating Actions",
    "SCA90": "Shot-Creating Actions / 90",
    "PassLive": "SCA via Live-Ball Pass",
    "PassDead": "SCA via Dead-Ball Pass",
    "TO": "SCA via Take-On",
    "Def": "SCA via Defensive Action",
    "GCA": "Goal-Creating Actions",
    "GCA90": "Goal-Creating Actions / 90",
    # --- defense detail ---
    "Tkl": "Tackles",
    "Def 3rd": "Tackles in Defensive Third",
    "Mid 3rd": "Tackles in Middle Third",
    "Att 3rd": "Tackles in Attacking Third",
    "Tkl%": "Tackle Success %",
    "Lost": "Challenges Lost",
    "Pass": "Passes Blocked (Defensive)",
    "Tkl+Int": "Tackles + Interceptions",
    "Clr": "Clearances",
    "Err": "Errors Leading to Shot",
    # --- possession detail ---
    "Touches": "Touches",
    "Def Pen": "Touches in Defensive Penalty Area",
    "Att Pen": "Touches in Attacking Penalty Area",
    "Succ": "Successful Take-Ons",
    "Succ%": "Take-On Success %",
    "Tkld": "Times Tackled During Take-On",
    "Tkld%": "Times Tackled During Take-On %",
    "Carries": "Carries",
    "CPA": "Carries into Penalty Area",
    "Mis": "Miscontrols",
    "Dis": "Dispossessed",
    "Rec": "Passes Received",
    # --- misc / duels ---
    "PKwon": "Penalty Kicks Won",
    "PKcon": "Penalty Kicks Conceded",
    "Recov": "Ball Recoveries",
    "Won": "Aerial Duels Won",
    "Won%": "Aerial Duel Success %",
    # --- advanced keeper ---
    "Thr": "Throws Attempted",
    "Launch%": "Launched Pass %",
    "AvgLen": "Average Pass Length",
    "Opp": "Crosses Faced",
    "Stp": "Crosses Stopped",
    "Stp%": "Cross Stop %",
    "#OPA": "Defensive Actions Outside Penalty Area",
    "#OPA/90": "Defensive Actions Outside Box / 90",
    "AvgDist": "Average Distance of Defensive Actions",
    "Att (GK)": "Passes Attempted (Excl. Goal Kicks)",
    # --- exact-key overrides for collision-group members (same canonical key,
    # different `type`, kept as separate stats by _dedup_stats) — without these,
    # humanize()'s canonical-key fallback would silently borrow the wrong
    # sibling's label (e.g. Sh_stats_gca falling back to plain "Sh" -> "Shots"). ---
    "FK": "Free Kick Shots",
    "FK_stats_passing_types": "Free Kicks Taken (Passing)",
    "FK_stats_keeper_adv": "Free Kicks Against",
    "CK_stats_keeper_adv": "Corner Kicks Against",
    "Blocks_stats_defense": "Shots/Passes Blocked (Defensive)",
    "Att_stats_defense": "Dribblers Challenged",
    "Att_stats_possession": "Take-Ons Attempted",
    "Att_stats_keeper_adv": "Crosses Faced (Attempted)",
    "1/3_stats_possession": "Carries into Final Third",
    "Lost_stats_misc": "Aerial Duels Lost",
    "Sh_stats_gca": "SCA via Shot",
    "Sh_stats_defense": "Shots Blocked",
    "TotDist_stats_possession": "Total Carrying Distance",
    "PrgDist_stats_possession": "Progressive Carrying Distance",
    "Live_stats_possession": "Live-Ball Touches",
    "Def 3rd_stats_possession": "Touches in Defensive Third",
    "Mid 3rd_stats_possession": "Touches in Middle Third",
    "Att 3rd_stats_possession": "Touches in Attacking Third",
    "Cmp_stats_keeper_adv": "Passes Completed (Excl. Goal Kicks)",
    "Cmp%_stats_keeper_adv": "Pass Completion % (Excl. Goal Kicks)",
    "OG_stats_keeper_adv": "Own Goals Conceded (as Keeper)",
}


def stat_sort_key(stat: dict) -> tuple[int, str]:
    return (_PRIORITY_RANK.get(stat["key"], len(PRIORITY_STATS)), stat["key"])


def canonical_key(column: str) -> str:
    for suffix in DUP_SUFFIXES:
        if column.endswith(suffix):
            return column[: -len(suffix)]
    return column


def is_advanced(key: str) -> bool:
    return key in ADVANCED_STAT_KEYS or canonical_key(key) in ADVANCED_STAT_KEYS


def is_negative_stat(key: str) -> bool:
    return key in NEGATIVE_STAT_KEYS or canonical_key(key) in NEGATIVE_STAT_KEYS


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

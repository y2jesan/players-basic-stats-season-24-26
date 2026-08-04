"""Deterministic fake football data — the single place to swap in a real data source.

Every function here returns a Polars DataFrame from a fixed random seed, so output is stable
across runs. Route handlers must only ever call these functions, never read data directly, so
swapping this module out (StatsBomb open data, an FBref scrape, a CSV export, a database) is a
one-file change.
"""

import random
from functools import lru_cache

import polars as pl

from app import dataset_loader
from app.analytics.football_common import parse_code_name, slugify

SEED = 20260804

FOOTBALL_SEASON = "2025-2026"
FOOTBALL_PLAYERS_CSV = "players_data-2025_2026.csv"
STAT_TYPE_JSON = "stat-type.json"

CITIES = [
    "Ashford",
    "Brentwood",
    "Castlebridge",
    "Dunmore",
    "Elmhurst",
    "Fenwick",
    "Grantshire",
    "Hartley",
    "Ironbridge",
    "Kestrel",
    "Lyndhurst",
    "Millbrook",
    "Norwood",
    "Oakfield",
    "Preston Vale",
    "Redmoor",
    "Stanmere",
    "Thornbury",
    "Uxford",
    "Wexley",
]
SUFFIXES = ["United", "City", "Rovers", "Athletic", "Town", "Wanderers", "Albion", "FC"]
LEAGUES = ["Premier Division", "Championship"]
COMPETITIONS = ["Premier Division", "Championship", "Cup"]

FIRST_NAMES = [
    "James",
    "Marcus",
    "Daniel",
    "Lucas",
    "Mateo",
    "Kwame",
    "Diego",
    "Ethan",
    "Noah",
    "Oliver",
    "Kai",
    "Leon",
    "Rafael",
    "Youssef",
    "Sven",
    "Andrei",
    "Bruno",
    "Kenji",
    "Milo",
    "Theo",
    "Adama",
    "Pierre",
    "Hassan",
    "Viktor",
    "Emil",
    "Jonas",
    "Mikael",
    "Tomas",
    "Nikola",
    "Ivan",
]
LAST_NAMES = [
    "Whitfield",
    "Reyes",
    "Okafor",
    "Novak",
    "Larsson",
    "Dubois",
    "Silva",
    "Kowalski",
    "Hughes",
    "Bennett",
    "Costa",
    "Andersen",
    "Moreau",
    "Schmidt",
    "Ferreira",
    "Mensah",
    "Ivanov",
    "Tanaka",
    "Walsh",
    "Nakamura",
    "Barros",
    "Diallo",
    "Petrov",
    "Haddad",
    "Lindgren",
    "Carvalho",
    "Bianchi",
]
NATIONALITIES = [
    "England",
    "Spain",
    "France",
    "Brazil",
    "Portugal",
    "Germany",
    "Netherlands",
    "Argentina",
    "Senegal",
    "Nigeria",
    "Ivory Coast",
    "Croatia",
    "Serbia",
    "Poland",
    "Sweden",
    "Denmark",
    "Norway",
    "Japan",
    "South Korea",
    "Belgium",
]
POSITIONS = ["GK", "DF", "MF", "FW"]
POSITION_WEIGHTS = [2, 7, 7, 4]
SHOT_OUTCOMES = ["Goal", "Saved", "Blocked", "Off Target", "Post"]


def _team_name(rng: random.Random, used: set[str]) -> str:
    while True:
        name = f"{rng.choice(CITIES)} {rng.choice(SUFFIXES)}"
        if name not in used:
            used.add(name)
            return name


def _short_code(name: str) -> str:
    words = name.split()
    if len(words) >= 2:
        return (words[0][:1] + words[1][:2]).upper()
    return name[:3].upper()


@lru_cache
def get_teams() -> pl.DataFrame:
    rng = random.Random(SEED)
    used: set[str] = set()
    rows = []
    for i in range(20):
        name = _team_name(rng, used)
        played = 26
        wins = rng.randint(6, 20)
        losses = rng.randint(2, max(3, played - wins - 2))
        draws = played - wins - losses
        goals_for = rng.randint(25, 65)
        goals_against = rng.randint(20, 55)
        rows.append(
            {
                "team_id": f"team-{i + 1}",
                "name": name,
                "short_code": _short_code(name),
                "league": LEAGUES[0] if i < 10 else LEAGUES[1],
                "season": "2025/26",
                "played": played,
                "wins": wins,
                "draws": draws,
                "losses": losses,
                "goals_for": goals_for,
                "goals_against": goals_against,
                "goal_difference": goals_for - goals_against,
                "points": wins * 3 + draws,
            }
        )

    df = pl.DataFrame(rows)
    position = (
        df.with_row_index("row")
        .sort(["league", "points", "goal_difference"], descending=[False, True, True])
        .with_columns(pl.cum_count("row").over("league").alias("position"))
        .sort("row")
        .select("position")
    )
    return df.with_columns(position.to_series())


@lru_cache
def get_players() -> pl.DataFrame:
    rng = random.Random(SEED + 1)
    teams = get_teams().to_dicts()
    rows = []
    player_id = 1
    for team in teams:
        for _ in range(20):
            position = rng.choices(POSITIONS, weights=POSITION_WEIGHTS, k=1)[0]
            appearances = rng.randint(3, 26)
            is_attacker = position in ("FW", "MF")
            goal_cap = max(1, round(appearances * (0.5 if is_attacker else 0.12)))
            assist_cap = max(1, round(appearances * (0.35 if is_attacker else 0.18)))
            goals = 0 if position == "GK" else rng.randint(0, goal_cap)
            assists = 0 if position == "GK" else rng.randint(0, assist_cap)
            xg = (
                0.0
                if position == "GK"
                else max(0.0, round(goals + rng.uniform(-0.5, 1.5), 1))
            )

            rows.append(
                {
                    "player_id": f"player-{player_id}",
                    "team_id": team["team_id"],
                    "team_name": team["name"],
                    "name": f"{rng.choice(FIRST_NAMES)} {rng.choice(LAST_NAMES)}",
                    "shirt_number": rng.randint(1, 33),
                    "age": rng.randint(18, 36),
                    "position": position,
                    "nationality": rng.choice(NATIONALITIES),
                    "appearances": appearances,
                    "minutes_played": appearances * rng.randint(45, 90),
                    "goals": goals,
                    "assists": assists,
                    "xg": xg,
                    "yellow_cards": rng.randint(0, 8),
                    "red_cards": 1 if rng.random() > 0.93 else 0,
                }
            )
            player_id += 1

    return pl.DataFrame(rows)


@lru_cache
def get_matches() -> pl.DataFrame:
    rng = random.Random(SEED + 2)
    teams = get_teams().to_dicts()
    rows = []
    for i in range(100):
        home, away = rng.sample(teams, 2)
        rows.append(
            {
                "match_id": f"match-{i + 1}",
                "date": f"2026-{((i // 10) % 12) + 1:02d}-{(i % 28) + 1:02d}",
                "competition": rng.choice(COMPETITIONS),
                "home_team_id": home["team_id"],
                "home_team": home["name"],
                "away_team_id": away["team_id"],
                "away_team": away["name"],
                "home_score": rng.randint(0, 4),
                "away_score": rng.randint(0, 4),
            }
        )
    return pl.DataFrame(rows)


@lru_cache
def get_shots(match_id: str) -> pl.DataFrame:
    """Shot events for one match, on a standard 120x80 StatsBomb-style pitch grid."""
    matches = get_matches()
    match = matches.filter(pl.col("match_id") == match_id)
    if match.is_empty():
        return pl.DataFrame(
            schema={
                "x": pl.Float64,
                "y": pl.Float64,
                "xg": pl.Float64,
                "outcome": pl.Utf8,
                "team": pl.Utf8,
                "player_name": pl.Utf8,
                "minute": pl.Int64,
            }
        )

    row = match.row(0, named=True)
    rng = random.Random(hash((SEED, match_id)) & 0xFFFFFFFF)
    players = get_players().filter(
        pl.col("team_id").is_in([row["home_team_id"], row["away_team_id"]])
    )
    player_pool = players.to_dicts()

    rows = []
    for _ in range(rng.randint(14, 26)):
        player = rng.choice(player_pool)
        attacking_home = player["team_id"] == row["home_team_id"]
        # Shots cluster toward the attacking team's target goal (x=120 for home, x=0 for away).
        x = rng.uniform(90, 119) if attacking_home else rng.uniform(1, 30)
        y = rng.uniform(15, 65)
        distance_factor = min(1.0, abs(x - (120 if attacking_home else 0)) / 30)
        xg = round(max(0.02, 0.5 - distance_factor * 0.4 + rng.uniform(-0.1, 0.1)), 2)

        rows.append(
            {
                "x": round(x, 1),
                "y": round(y, 1),
                "xg": xg,
                "outcome": rng.choice(SHOT_OUTCOMES),
                "team": row["home_team"] if attacking_home else row["away_team"],
                "player_name": player["name"],
                "minute": rng.randint(1, 90),
            }
        )

    return pl.DataFrame(rows)


_POSITION_ZONES = {
    "GK": (5, 15, 25, 55),
    "DF": (12, 48, 5, 75),
    "MF": (32, 88, 8, 72),
    "FW": (68, 118, 12, 68),
}


@lru_cache
def get_player_touches(player_id: str) -> pl.DataFrame:
    """Synthetic touch locations for a player's positional heatmap, on the 120x80 pitch grid."""
    players = get_players().filter(pl.col("player_id") == player_id)
    if players.is_empty():
        return pl.DataFrame(schema={"x": pl.Float64, "y": pl.Float64})

    position = players.row(0, named=True)["position"]
    x_min, x_max, y_min, y_max = _POSITION_ZONES[position]
    rng = random.Random(hash((SEED, player_id)) & 0xFFFFFFFF)

    x_center = (x_min + x_max) / 2
    y_center = (y_min + y_max) / 2
    x_spread = (x_max - x_min) / 2
    y_spread = (y_max - y_min) / 2

    rows = []
    for _ in range(rng.randint(90, 160)):
        x = min(max(rng.gauss(x_center, x_spread / 2), 0), 120)
        y = min(max(rng.gauss(y_center, y_spread / 2), 0), 80)
        rows.append({"x": round(x, 1), "y": round(y, 1)})

    return pl.DataFrame(rows)


@lru_cache
def get_football_players() -> pl.DataFrame:
    """Real 2025/26 top-5-league player rows, with synthetic ids and parsed competition
    fields layered on top. The CSV has no id column (Rk resets per merged source table,
    not unique) and no Season column (implied only by the filename), so both are added
    here — a second season's CSV would just supply its own FOOTBALL_SEASON-equivalent
    value, keeping every downstream analytics function season-agnostic."""
    df = dataset_loader.load_csv(FOOTBALL_PLAYERS_CSV)

    comp_name = df["Comp"].map_elements(
        lambda v: (parse_code_name(v) or {}).get("name"), return_dtype=pl.Utf8
    )
    comp_country_code = df["Comp"].map_elements(
        lambda v: (parse_code_name(v) or {}).get("code"), return_dtype=pl.Utf8
    )
    nationality_code = df["Nation"].map_elements(
        lambda v: (parse_code_name(v) or {}).get("code"), return_dtype=pl.Utf8
    )
    nationality_name = df["Nation"].map_elements(
        lambda v: (parse_code_name(v) or {}).get("name"), return_dtype=pl.Utf8
    )

    return (
        df.with_row_index("row_idx")
        .with_columns(
            (pl.lit("p") + pl.col("row_idx").cast(pl.Utf8)).alias("player_id"),
            pl.col("Squad").map_elements(slugify, return_dtype=pl.Utf8).alias("team_id"),
            pl.lit(FOOTBALL_SEASON).alias("season"),
            comp_name.alias("competition_name"),
            comp_country_code.alias("competition_country_code"),
            nationality_code.alias("nationality_code"),
            nationality_name.alias("nationality_name"),
        )
        .with_columns(
            pl.col("competition_name").map_elements(slugify, return_dtype=pl.Utf8).alias("competition_id"),
        )
        .drop("row_idx")
    )


@lru_cache
def get_stat_type_map() -> dict[str, str]:
    """Maps every real-dataset column name to its stat-type.json category."""
    df = dataset_loader.load_json(STAT_TYPE_JSON)
    return dict(zip(df["property"].to_list(), df["type"].to_list(), strict=True))


@lru_cache
def get_stat_reference() -> pl.DataFrame:
    """Full stat-type.json rows (property, type, short/long description) for the glossary."""
    return dataset_loader.load_json(STAT_TYPE_JSON)

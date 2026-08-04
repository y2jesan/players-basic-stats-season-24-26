import polars as pl

from app.analytics.football_catalog import list_countries, list_stat_glossary
from app.analytics.football_common import (
    canonical_key,
    parse_code_name,
    slugify,
    split_positions,
)
from app.analytics.football_countries import get_country_detail
from app.analytics.football_players import get_player_detail
from app.analytics.football_teams import get_team_detail, list_teams

STAT_TYPE_MAP = {
    "90s": "match",
    "90s_stats_keeper": "match",
    "Gls": "shooting",
    "Ast": "passing",
    "PKatt": "shooting",
    "PKatt_stats_keeper": "keeping",
    "CrdY": "decipline",
    "CrdY_stats_misc": "decipline",
    "GA": "keeping",
}


def _player_row(**overrides) -> dict:
    row = {
        "Player": "Test Keeper",
        "Squad": "Test FC",
        "Nation": "eng ENG",
        "Pos": "GK",
        "Comp": "eng Premier League",
        "Age": 27,
        "Born": 1998,
        "player_id": "p1",
        "team_id": "test-fc",
        "season": "2025-2026",
        "competition_id": "premier-league",
        "competition_name": "Premier League",
        "competition_country_code": "eng",
        "90s": 10.0,
        "90s_stats_keeper": 10.0,
        "Gls": 0,
        "Ast": 0,
        "PKatt": 0,
        "PKatt_stats_keeper": 3,
        "CrdY": 1,
        "CrdY_stats_misc": 1,
        "GA": 12,
    }
    row.update(overrides)
    return row


def _fixture_df(rows: list[dict]) -> pl.DataFrame:
    return pl.DataFrame(rows)


def test_canonical_key_strips_known_suffixes():
    assert canonical_key("90s_stats_keeper") == "90s"
    assert canonical_key("CrdY_stats_misc") == "CrdY"
    assert canonical_key("Gls") == "Gls"


def test_canonical_key_strips_2024_2025_season_suffixes():
    assert canonical_key("Rk_stats_passing") == "Rk"
    assert canonical_key("Att_stats_passing_types") == "Att"
    assert canonical_key("Sh_stats_gca") == "Sh"
    assert canonical_key("Tkl_stats_defense") == "Tkl"
    assert canonical_key("Touches_stats_possession") == "Touches"
    assert canonical_key("GA_stats_keeper_adv") == "GA"


def test_parse_code_name_splits_code_and_name():
    assert parse_code_name("eng Premier League") == {"code": "eng", "name": "Premier League"}
    assert parse_code_name("us USA") == {"code": "us", "name": "USA"}
    assert parse_code_name("") is None
    assert parse_code_name(None) is None


def test_split_positions_handles_multi_value_and_blank():
    assert split_positions("MF,FW") == ["MF", "FW"]
    assert split_positions("GK") == ["GK"]
    assert split_positions("") == []
    assert split_positions(None) == []


def test_slugify_strips_accents_and_punctuation():
    assert slugify("Real Betis") == "real-betis"
    assert slugify("Alavés") == "alaves"
    assert slugify("Nott'ham Forest") == "nott-ham-forest"


def test_list_teams_aggregates_player_rows():
    df = _fixture_df(
        [
            {
                "team_id": "test-fc",
                "Squad": "Test FC",
                "competition_id": "premier-league",
                "competition_name": "Premier League",
                "competition_country_code": "eng",
                "Gls": 5,
                "Ast": 3,
                "Age": 24.0,
                "CrdY": 1,
                "CrdR": 0,
            },
            {
                "team_id": "test-fc",
                "Squad": "Test FC",
                "competition_id": "premier-league",
                "competition_name": "Premier League",
                "competition_country_code": "eng",
                "Gls": 2,
                "Ast": 4,
                "Age": 30.0,
                "CrdY": 2,
                "CrdR": 1,
            },
        ]
    )

    teams = list_teams(df, competition="premier-league")

    assert teams.height == 1
    row = teams.row(0, named=True)
    assert row["name"] == "Test FC"
    assert row["player_count"] == 2
    assert row["total_goals"] == 7
    assert row["total_assists"] == 7
    assert row["avg_age"] == 27.0
    assert row["total_yellow_cards"] == 3
    assert row["total_red_cards"] == 1


def test_list_teams_filters_by_competition():
    df = _fixture_df(
        [
            {
                "team_id": "team-a",
                "Squad": "Team A",
                "competition_id": "premier-league",
                "competition_name": "Premier League",
                "competition_country_code": "eng",
                "Gls": 1,
                "Ast": 1,
                "Age": 25.0,
                "CrdY": 0,
                "CrdR": 0,
            },
            {
                "team_id": "team-b",
                "Squad": "Team B",
                "competition_id": "la-liga",
                "competition_name": "La Liga",
                "competition_country_code": "es",
                "Gls": 1,
                "Ast": 1,
                "Age": 25.0,
                "CrdY": 0,
                "CrdR": 0,
            },
        ]
    )

    teams = list_teams(df, competition="la-liga")

    assert teams["team_id"].to_list() == ["team-b"]


def test_get_player_detail_dedups_real_duplicate_and_splits_exception():
    df = _fixture_df([_player_row()])

    detail = get_player_detail(df, STAT_TYPE_MAP, "p1")

    assert detail is not None
    match_card = next(c for c in detail["cards"] if c["type"] == "match")
    assert [s["key"] for s in match_card["stats"]].count("90s") == 1

    shooting_card = next(c for c in detail["cards"] if c["type"] == "shooting")
    shooting_keys = {s["key"]: s["value"] for s in shooting_card["stats"]}
    assert shooting_keys["PKatt"] == 0

    keeping_card = next(c for c in detail["cards"] if c["type"] == "keeping")
    keeping_keys = {s["key"]: s["value"] for s in keeping_card["stats"]}
    assert keeping_keys["PKatt_stats_keeper"] == 3
    assert keeping_keys["GA"] == 12


def test_get_player_detail_outfield_player_has_no_keeping_card():
    df = _fixture_df(
        [
            _player_row(
                player_id="p2",
                Pos="FW",
                PKatt_stats_keeper=None,
                GA=None,
                Gls=9,
            )
        ]
    )

    detail = get_player_detail(df, STAT_TYPE_MAP, "p2")

    assert detail is not None
    card_types = {c["type"] for c in detail["cards"]}
    assert "keeping" not in card_types


def test_get_player_detail_unknown_id_returns_none():
    df = _fixture_df([_player_row()])

    assert get_player_detail(df, STAT_TYPE_MAP, "does-not-exist") is None


def test_get_player_detail_flags_advanced_stats():
    stat_type_map = {**STAT_TYPE_MAP, "xG": "shooting"}
    df = _fixture_df([_player_row(xG=1.4)])

    detail = get_player_detail(df, stat_type_map, "p1")

    shooting_card = next(c for c in detail["cards"] if c["type"] == "shooting")
    by_key = {s["key"]: s for s in shooting_card["stats"]}
    assert by_key["xG"]["advanced"] is True
    assert by_key["Gls"]["advanced"] is False


def _country_rows() -> list[dict]:
    return [
        {
            "Player": "Alice Striker",
            "player_id": "p1",
            "Squad": "Team A",
            "team_id": "team-a",
            "Pos": "FW",
            "Comp": "eng Premier League",
            "Age": 24,
            "MP": 20,
            "Gls": 10,
            "Ast": 4,
            "CrdY": 1,
            "CrdR": 0,
            "nationality_code": "eng",
            "nationality_name": "ENG",
            "season": "2025-2026",
        },
        {
            "Player": "Bob Keeper",
            "player_id": "p2",
            "Squad": "Team A",
            "team_id": "team-a",
            "Pos": "GK",
            "Comp": "eng Premier League",
            "Age": 29,
            "MP": 18,
            "Gls": 0,
            "Ast": 0,
            "CrdY": 0,
            "CrdR": 0,
            "nationality_code": "es",
            "nationality_name": "ESP",
            "season": "2025-2026",
        },
        {
            "Player": "Carlos Winger",
            "player_id": "p3",
            "Squad": "Team B",
            "team_id": "team-b",
            "Pos": "MF",
            "Comp": "es La Liga",
            "Age": 22,
            "MP": 15,
            "Gls": 3,
            "Ast": 6,
            "CrdY": 2,
            "CrdR": 0,
            "nationality_code": "es",
            "nationality_name": "ESP",
            "season": "2025-2026",
        },
    ]


def test_list_countries_aggregates_by_nationality():
    df = _fixture_df(_country_rows())

    countries = list_countries(df)

    by_code = {c["code"]: c for c in countries}
    assert by_code["eng"]["player_count"] == 1
    assert by_code["es"]["player_count"] == 2


def test_get_country_detail_spans_multiple_teams():
    df = _fixture_df(_country_rows())

    detail = get_country_detail(df, "es")

    assert detail is not None
    assert detail["country"]["player_count"] == 2
    assert {p["team_name"] for p in detail["players"]} == {"Team A", "Team B"}


def test_get_country_detail_unknown_code_returns_none():
    df = _fixture_df(_country_rows())

    assert get_country_detail(df, "zz") is None


def _two_season_rows() -> list[dict]:
    return [
        {
            "Player": "New Signing",
            "player_id": "2025-2026-p1",
            "Squad": "Test FC",
            "team_id": "test-fc",
            "Pos": "FW",
            "Comp": "eng Premier League",
            "Age": 24,
            "Gls": 10,
            "Ast": 2,
            "nationality_code": "eng",
            "nationality_name": "England",
            "season": "2025-2026",
        },
        {
            "Player": "Old Squad Member",
            "player_id": "2024-2025-p1",
            "Squad": "Test FC",
            "team_id": "test-fc",
            "Pos": "MF",
            "Comp": "eng Premier League",
            "Age": 23,
            "Gls": 4,
            "Ast": 8,
            "nationality_code": "eng",
            "nationality_name": "England",
            "season": "2024-2025",
        },
    ]


def test_get_team_detail_scoped_by_season_excludes_other_season_rows():
    df = _fixture_df(_two_season_rows())

    current = get_team_detail(df, "test-fc", season="2025-2026")
    previous = get_team_detail(df, "test-fc", season="2024-2025")

    assert current is not None and previous is not None
    assert current["team"]["season"] == "2025-2026"
    assert [p["name"] for p in current["players"]] == ["New Signing"]
    assert previous["team"]["season"] == "2024-2025"
    assert [p["name"] for p in previous["players"]] == ["Old Squad Member"]


def test_get_team_detail_without_season_spans_all_rows():
    df = _fixture_df(_two_season_rows())

    detail = get_team_detail(df, "test-fc")

    assert detail is not None
    assert detail["team"]["player_count"] == 2


def test_get_country_detail_scoped_by_season():
    df = _fixture_df(_two_season_rows())

    current = get_country_detail(df, "eng", season="2025-2026")
    previous = get_country_detail(df, "eng", season="2024-2025")

    assert current is not None and previous is not None
    assert [p["name"] for p in current["players"]] == ["New Signing"]
    assert [p["name"] for p in previous["players"]] == ["Old Squad Member"]


def test_list_stat_glossary_sorted_and_includes_descriptions():
    raw = pl.DataFrame(
        [
            {
                "property": "Fls",
                "type": "decipline",
                "short_description": "Fouls committed.",
                "long_description": "Fouls committed by the player.",
            },
            {
                "property": "Gls",
                "type": "shooting",
                "short_description": "Goals scored.",
                "long_description": "Goals scored by the player.",
            },
            {
                "property": "MP",
                "type": "match",
                "short_description": "Matches played.",
                "long_description": "Matches the player appeared in.",
            },
        ]
    )

    glossary = list_stat_glossary(raw)

    assert [g["property"] for g in glossary] == ["MP", "Gls", "Fls"]
    assert glossary[0]["short_description"] == "Matches played."

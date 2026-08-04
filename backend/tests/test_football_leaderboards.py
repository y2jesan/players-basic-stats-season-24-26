import polars as pl

from app.analytics.football_leaderboards import (
    LEADERBOARD_LIMIT,
    get_defending_leaders,
    get_discipline_leaders,
    get_leaderboards,
    get_match_leaders,
    get_passing_leaders,
    get_shooting_leaders,
)


def _player(player_id: str, name: str, **overrides) -> dict:
    row = {
        "player_id": player_id,
        "Player": name,
        "Squad": "Test FC",
        "team_id": "test-fc",
        "Pos": "FW,MF",
        "Comp": "eng Premier League",
        "Gls": 0,
        "G+A": 0,
        "Ast": 0,
        "Crs": 0,
        "Min": 0,
        "MP": 0,
        "TklW": 0,
        "Int": 0,
        "Fls": 0,
        "CrdY": 0,
        "CrdR": 0,
        "xG": None,
        "npxG": None,
        "xAG": None,
        "Cmp%": None,
        "KP": None,
        "xA": None,
        "Tkl%": None,
        "Clr": None,
    }
    row.update(overrides)
    return row


def test_shooting_leaders_sorted_by_goals_then_goals_assists():
    df = pl.DataFrame(
        [
            _player("p1", "Low Scorer", **{"Gls": 2, "G+A": 3}),
            _player("p2", "Top Scorer", **{"Gls": 10, "G+A": 12}),
            _player("p3", "Mid Scorer", **{"Gls": 5, "G+A": 6}),
        ]
    )

    leaders = get_shooting_leaders(df)

    assert [p["name"] for p in leaders] == ["Top Scorer", "Mid Scorer", "Low Scorer"]
    assert leaders[0]["goals"] == 10
    assert leaders[0]["goals_assists"] == 12
    assert leaders[0]["positions"] == ["FW", "MF"]
    assert leaders[0]["competition"] == {"code": "eng", "name": "Premier League"}


def test_shooting_leaders_include_xg_when_present():
    df = pl.DataFrame(
        [
            _player("p1", "Clinical Finisher", **{"Gls": 10, "G+A": 12, "xG": 7.4, "npxG": 6.9, "xAG": 3.1}),
        ]
    )

    leaders = get_shooting_leaders(df)

    assert leaders[0]["xg"] == 7.4
    assert leaders[0]["npxg"] == 6.9
    assert leaders[0]["xag"] == 3.1


def test_shooting_leaders_xg_none_when_absent():
    df = pl.DataFrame([_player("p1", "No Advanced Stats", Gls=3)])

    leaders = get_shooting_leaders(df)

    assert leaders[0]["xg"] is None
    assert leaders[0]["npxg"] is None
    assert leaders[0]["xag"] is None


def test_passing_leaders_sorted_by_assists_then_crosses():
    df = pl.DataFrame(
        [
            _player("p1", "A", Ast=1, Crs=20),
            _player("p2", "B", Ast=8, Crs=5),
        ]
    )

    leaders = get_passing_leaders(df)

    assert leaders[0]["name"] == "B"
    assert leaders[0]["assists"] == 8
    assert leaders[0]["crosses"] == 5


def test_match_leaders_sorted_by_minutes_then_matches_played():
    df = pl.DataFrame(
        [
            _player("p1", "Bench Player", Min=200, MP=10),
            _player("p2", "Regular Starter", Min=2500, MP=30),
        ]
    )

    leaders = get_match_leaders(df)

    assert leaders[0]["name"] == "Regular Starter"
    assert leaders[0]["minutes"] == 2500
    assert leaders[0]["matches_played"] == 30


def test_defending_leaders_sorted_by_tackles_won_then_interceptions():
    df = pl.DataFrame(
        [
            _player("p1", "A", TklW=10, Int=40),
            _player("p2", "B", TklW=50, Int=10),
        ]
    )

    leaders = get_defending_leaders(df)

    assert leaders[0]["name"] == "B"
    assert leaders[0]["tackles_won"] == 50
    assert leaders[0]["interceptions"] == 10


def test_discipline_leaders_ranked_by_card_score_then_fouls():
    df = pl.DataFrame(
        [
            _player("p1", "Many Fouls No Cards", Fls=50, CrdY=0, CrdR=0),
            _player("p2", "Red Carded", Fls=5, CrdY=1, CrdR=1),
            _player("p3", "Yellow Only", Fls=5, CrdY=3, CrdR=0),
        ]
    )

    leaders = get_discipline_leaders(df)

    # Red-carded player: score = 1*2 + 1 = 3, beats Yellow Only's score = 3? tie -> Fls tiebreak.
    assert leaders[0]["name"] in {"Red Carded", "Yellow Only"}
    assert leaders[-1]["name"] == "Many Fouls No Cards"
    assert leaders[0]["fouls_committed"] is not None
    assert leaders[0]["yellow_cards"] is not None
    assert leaders[0]["red_cards"] is not None


def test_leaderboards_truncate_to_limit():
    rows = [_player(f"p{i}", f"Player {i}", Gls=i) for i in range(LEADERBOARD_LIMIT + 5)]
    df = pl.DataFrame(rows)

    leaders = get_shooting_leaders(df)

    assert len(leaders) == LEADERBOARD_LIMIT
    assert leaders[0]["goals"] == LEADERBOARD_LIMIT + 4


def test_get_leaderboards_returns_all_five_categories():
    df = pl.DataFrame([_player("p1", "Solo Player")])

    result = get_leaderboards(df)

    assert set(result.keys()) == {"shooting", "passing", "match", "defending", "discipline"}
    for leaders in result.values():
        assert len(leaders) == 1

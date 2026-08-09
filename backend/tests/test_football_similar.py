import polars as pl

from app.analytics.football_similar import get_similar_players


def _row(**overrides) -> dict:
    row = {
        "Player": "Player",
        "Squad": "Squad FC",
        "Pos": "MF",
        "Age": 25,
        "player_id": "id",
        "team_id": "team",
        "season": "2024-2025",
    }
    row.update(overrides)
    return row


def _fixture_df(rows: list[dict]) -> pl.DataFrame:
    return pl.DataFrame(rows)


# Two MF feature columns (Tkl+Int, PrgP) drive the distance ranking below; every other
# POSITION_RADAR_STATS["MF"] column is left absent so it's excluded from the feature
# set entirely (mirrors how a season missing detail-table columns behaves in prod).
TARGET = _row(Player="Target", player_id="target-1", team_id="target-fc", Age=25, **{"Tkl+Int": 10, "PrgP": 20})

CLOSE = _row(Player="Close", player_id="close-1", team_id="close-fc", Age=30, **{"Tkl+Int": 11, "PrgP": 21})
EXTRA = _row(Player="Extra", player_id="extra-1", team_id="extra-fc", Age=35, **{"Tkl+Int": 12, "PrgP": 22})
MID = _row(Player="Mid", player_id="mid-1", team_id="mid-fc", Age=22, **{"Tkl+Int": 15, "PrgP": 25})
FAR = _row(Player="Far", player_id="far-1", team_id="far-fc", Age=27, **{"Tkl+Int": 30, "PrgP": 50})
FAR2 = _row(Player="Far2", player_id="far2-1", team_id="far2-fc", Age=20, **{"Tkl+Int": 35, "PrgP": 55})

POOL_ROWS = [TARGET, CLOSE, EXTRA, MID, FAR, FAR2]


def test_get_similar_players_ranks_by_distance_excluding_self():
    result = get_similar_players(_fixture_df(POOL_ROWS), "target-1")

    similar_ids = [p["player_id"] for p in result["similar"]]
    assert "target-1" not in similar_ids
    assert similar_ids == ["close-1", "extra-1", "mid-1"]
    assert result["player"]["player_id"] == "target-1"


def test_get_similar_players_young_bucket_is_age_filtered_subset_of_ranked_order():
    result = get_similar_players(_fixture_df(POOL_ROWS), "target-1")

    # mid-1 (age 22) is closest-3 by distance *and* young, but it's already surfaced in
    # `similar` — it must not also appear in `young`, or the two comp-card lists would
    # render a duplicate entry for the same player.
    young_ids = [p["player_id"] for p in result["young"]]
    assert young_ids == ["far2-1"]
    assert all(p["age"] <= 23 for p in result["young"])


def test_get_similar_players_young_excludes_players_already_in_similar():
    result = get_similar_players(_fixture_df(POOL_ROWS), "target-1")

    similar_ids = {p["player_id"] for p in result["similar"]}
    young_ids = {p["player_id"] for p in result["young"]}
    assert similar_ids.isdisjoint(young_ids)


def test_get_similar_players_missing_player_returns_none():
    result = get_similar_players(_fixture_df(POOL_ROWS), "does-not-exist")
    assert result is None


def test_get_similar_players_no_primary_position_returns_empty_lists():
    blank_pos_target = _row(Player="NoPos", player_id="nopos-1", Pos="", **{"Tkl+Int": 10})
    result = get_similar_players(_fixture_df([blank_pos_target, CLOSE]), "nopos-1")
    assert result == {"player": None, "similar": [], "young": []}


def test_get_similar_players_fewer_candidates_than_requested_returns_fewer():
    result = get_similar_players(_fixture_df([TARGET, CLOSE]), "target-1")
    assert [p["player_id"] for p in result["similar"]] == ["close-1"]
    assert result["young"] == []
    assert result["player"]["player_id"] == "target-1"


def test_get_similar_players_zero_usable_features_returns_empty_lists():
    no_stats_target = _row(Player="NoStats", player_id="nostats-1")
    result = get_similar_players(_fixture_df([no_stats_target, CLOSE]), "nostats-1")
    assert result["similar"] == []
    assert result["young"] == []
    assert result["player"]["player_id"] == "nostats-1"


def test_get_similar_players_no_candidate_pool_still_returns_own_summary():
    result = get_similar_players(_fixture_df([TARGET]), "target-1")
    assert result["similar"] == []
    assert result["young"] == []
    assert result["player"]["player_id"] == "target-1"


def test_get_similar_players_keeper_card_stats_lead_with_saves_not_save_pct():
    keeper_target = _row(
        Player="Keeper Target", player_id="gk-target", Pos="GK", **{"Saves": 80, "Save%": 70.0}
    )
    keeper_other = _row(Player="Keeper Other", player_id="gk-other", Pos="GK", **{"Saves": 60, "Save%": 65.0})
    result = get_similar_players(_fixture_df([keeper_target, keeper_other]), "gk-target")

    assert result["player"]["stats"][0]["key"] == "Saves"
    assert result["player"]["stats"][0]["value"] == 80
    assert result["player"]["stats"][1]["key"] == "Save%"
    for entry in result["similar"]:
        assert entry["stats"][0]["key"] == "Saves"

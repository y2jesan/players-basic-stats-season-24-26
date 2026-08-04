import sqlite3

import pytest

from app.dataset_loader import load_csv, load_sqlite


def test_load_csv_returns_dataframe(tmp_path):
    csv_path = tmp_path / "players.csv"
    csv_path.write_text("name,goals\nAlice,10\nBob,3\n")

    df = load_csv("players.csv", base_dir=tmp_path)

    assert df.shape == (2, 2)
    assert df["name"].to_list() == ["Alice", "Bob"]


def test_load_csv_missing_file_raises(tmp_path):
    with pytest.raises(FileNotFoundError):
        load_csv("missing.csv", base_dir=tmp_path)


def test_load_sqlite_returns_dataframe(tmp_path):
    db_path = tmp_path / "players.sqlite"
    connection = sqlite3.connect(db_path)
    connection.execute("CREATE TABLE players (name TEXT, goals INTEGER)")
    connection.execute("INSERT INTO players VALUES ('Alice', 10), ('Bob', 3)")
    connection.commit()
    connection.close()

    df = load_sqlite(
        "players.sqlite", "SELECT * FROM players ORDER BY name", base_dir=tmp_path
    )

    assert df.shape == (2, 2)
    assert df["name"].to_list() == ["Alice", "Bob"]

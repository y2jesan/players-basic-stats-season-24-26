"""Thin readers for real data files dropped into backend/datasets/.

Each function returns a Polars DataFrame and raises FileNotFoundError if the file isn't there —
no silent fallback to sample data. Called from sample_data.py, the single place route handlers
pull data from; nothing outside sample_data.py should import this module directly.
"""

import sqlite3
from pathlib import Path

import polars as pl

from app.config import get_settings


def _resolve(filename: str, base_dir: Path | None) -> Path:
    directory = base_dir if base_dir is not None else get_settings().dataset_dir_path
    path = directory / filename
    if not path.is_file():
        raise FileNotFoundError(f"No such dataset file: {path}")
    return path


def load_csv(filename: str, *, base_dir: Path | None = None) -> pl.DataFrame:
    return pl.read_csv(_resolve(filename, base_dir))


def load_json(filename: str, *, base_dir: Path | None = None) -> pl.DataFrame:
    return pl.read_json(_resolve(filename, base_dir))


def load_excel(
    filename: str, *, sheet_name: str | None = None, base_dir: Path | None = None
) -> pl.DataFrame:
    return pl.read_excel(_resolve(filename, base_dir), sheet_name=sheet_name)


def load_sqlite(
    filename: str, query: str, *, base_dir: Path | None = None
) -> pl.DataFrame:
    connection = sqlite3.connect(_resolve(filename, base_dir))
    try:
        return pl.read_database(query, connection)
    finally:
        connection.close()

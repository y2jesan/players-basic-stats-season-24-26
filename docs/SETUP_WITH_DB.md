# Adding persistence later

This boilerplate ships with no database on purpose — `backend/app/sample_data.py` generates
everything in memory. This document describes how to add real persistence when you need it. It's
reference material: **nothing here is implemented yet.**

Two options, depending on what you actually need:

- **DuckDB** — a single file, no server process, reads Parquet directly with SQL. The lighter
  choice; good for a read-mostly analytics app, even with a fair amount of data.
- **PostgreSQL** — a real server. Reach for this once you need concurrent writes, multiple
  processes/users hitting the same data, or transactions.

## Option A: DuckDB

### Install

```bash
cd backend
uv add duckdb
```

No server to run — DuckDB opens a local `.duckdb` file (or queries Parquet files directly)
in-process.

### Config changes

Add a setting to `backend/app/config.py`:

```python
duckdb_path: str = "backend/app/data/football.duckdb"
```

...and a line to `.env.example`:

```
DUCKDB_PATH=backend/app/data/football.duckdb
```

### Restructuring `sample_data.py`

Turn the module-level functions into thin queries against DuckDB, keeping the exact same
signatures so nothing else in the app changes:

```python
# app/db.py — new file
import duckdb
from app.config import get_settings

def get_connection() -> duckdb.DuckDBPyConnection:
    return duckdb.connect(get_settings().duckdb_path)
```

```python
# app/sample_data.py — same function signatures, real queries instead of generation
import polars as pl
from app.db import get_connection

def get_teams() -> pl.DataFrame:
    return get_connection().execute("SELECT * FROM teams").pl()

def get_players() -> pl.DataFrame:
    return get_connection().execute("SELECT * FROM players").pl()
```

Drop the `@lru_cache` decorators once data can change at runtime — or keep them with a manual
cache-clear if the data only changes via a separate ingestion step.

DuckDB can also query Parquet files directly without loading them into a database file at all
(`SELECT * FROM 'players.parquet'`), which is worth considering if you're just pointing at
exported data rather than writing to it.

## Option B: PostgreSQL

### Install

```bash
cd backend
uv add psycopg[binary] sqlalchemy
```

You'll also need a running Postgres instance — locally via your package manager or Postgres.app,
or a managed instance in whatever cloud you deploy to.

### Config changes

Add a connection string setting to `backend/app/config.py`:

```python
database_url: str = "postgresql://localhost/football"
```

...and to `.env.example`:

```
DATABASE_URL=postgresql://user:password@localhost:5432/football
```

### Restructuring `sample_data.py`

Same principle as DuckDB — same function signatures, real queries. With SQLAlchemy Core (no ORM
needed for read-mostly access):

```python
# app/db.py — new file
from sqlalchemy import create_engine
from app.config import get_settings

engine = create_engine(get_settings().database_url)
```

```python
# app/sample_data.py
import polars as pl
from app.db import engine

def get_teams() -> pl.DataFrame:
    return pl.read_database("SELECT * FROM teams", engine)
```

### Suggested schema

A single `events` table with a JSON/JSONB raw column is the pragmatic starting point for football
event data — the shape of a "shot" and a "pass" differ enough that a fully normalized schema is
premature until you know your query patterns:

```sql
CREATE TABLE teams (
    team_id      TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    short_code   TEXT NOT NULL,
    league       TEXT NOT NULL,
    season       TEXT NOT NULL
);

CREATE TABLE players (
    player_id    TEXT PRIMARY KEY,
    team_id      TEXT REFERENCES teams(team_id),
    name         TEXT NOT NULL,
    position     TEXT NOT NULL,
    nationality  TEXT NOT NULL
);

CREATE TABLE matches (
    match_id     TEXT PRIMARY KEY,
    date         DATE NOT NULL,
    home_team_id TEXT REFERENCES teams(team_id),
    away_team_id TEXT REFERENCES teams(team_id),
    home_score   INTEGER NOT NULL,
    away_score   INTEGER NOT NULL
);

-- One row per event (shot, pass, tackle, ...). `data` holds whatever fields
-- that event type needs — x/y, xg, outcome, body part, pass end location, etc.
-- Normalize specific event types into their own tables later, once you know
-- which ones you actually query often enough to justify it.
CREATE TABLE events (
    event_id     BIGSERIAL PRIMARY KEY,
    match_id     TEXT REFERENCES matches(match_id),
    player_id    TEXT REFERENCES players(player_id),
    event_type   TEXT NOT NULL,      -- 'shot', 'pass', 'tackle', ...
    minute       INTEGER NOT NULL,
    data         JSONB NOT NULL      -- { "x": 105.2, "y": 40.1, "xg": 0.31, ... }
);

CREATE INDEX events_match_idx ON events(match_id);
CREATE INDEX events_type_idx ON events(event_type);
```

Querying a specific event type's fields out of the JSONB column:

```sql
SELECT
    player_id,
    (data->>'x')::float AS x,
    (data->>'y')::float AS y,
    (data->>'xg')::float AS xg
FROM events
WHERE match_id = 'match-1' AND event_type = 'shot';
```

## Either way

- Keep `analytics/` and `plots/` untouched — they only ever receive Polars DataFrames, so they
  don't care whether those DataFrames came from `sample_data.py`'s generator or a real query.
- Add a migration tool (Alembic for Postgres; DuckDB doesn't really need one for a single
  analytics file) once the schema needs to evolve across environments.
- Consider whether route handlers still need `@lru_cache` on the data-access functions — helpful
  for static generated data, actively harmful once the underlying data can change.

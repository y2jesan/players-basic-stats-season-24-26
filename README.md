# Football Player Stats Dashboard

A multi-season (2024-25 and 2025-26) football/soccer player statistics
explorer — browse teams, players, and countries across the top 5 European
leagues, drill into category leaderboards, and look up every stat's meaning
in a built-in glossary. Backend is FastAPI + Polars, frontend is React +
TanStack Router/Query/Table + shadcn/ui.

## Screenshots

<!-- Drop PNGs into docs/screenshots/ using the filenames below and they'll render here automatically. See docs/screenshots/README.md for the full convention. -->

| | |
| --- | --- |
| ![Dashboard](docs/screenshots/dashboard.png) | ![Player detail](docs/screenshots/player-detail.png) |
| ![Team detail](docs/screenshots/team-detail.png) | ![Leaderboard](docs/screenshots/leaderboard-shooting.png) |

## Features

- **Season & competition switching** — every page scopes its data to the
  selected season (2024-25 / 2025-26) and competition; switching either
  re-fetches everything downstream.
- **Dashboard** — headline stat cards, a sortable team table and a country
  table for the selected competition/season, plus top-N leaderboard cards.
- **Team, player, and country detail pages** — full rosters, player profiles
  grouped into stat cards (Match, Shooting, Passing, Creation, Possession,
  Discipline, Keeping, Defending), reached by clicking through from the
  dashboard.
- **Category leaderboards** (Shooting, Passing, Match, Defending, Discipline)
  with sortable, hideable columns via a shared `DataTable` component.
- **Advanced-stat highlighting** — expected-value metrics (xG, xAG, xA, GCA,
  SCA, PSxG, ...) are visually flagged wherever they appear, since they're
  only available for seasons whose source data includes them.
- **Stat glossary** — every column gets a short and long description, sourced
  from `backend/datasets/stat-type.json` and surfaced as tooltips throughout
  the app.
- **Server-rendered pitch plots** — heatmaps and shot maps via `mplsoccer`,
  rendered on the backend and served as PNGs.
- **Analysis page** — a server-paginated data table over the raw dataset.

## Tech stack

**Backend** (`backend/`, Python ≥3.14, managed by [uv](https://docs.astral.sh/uv/)):
FastAPI, Polars, Pandas/PyArrow, mplsoccer + Matplotlib for plotting,
pydantic-settings for config. Tests via pytest, linting via ruff.

**Frontend** (`frontend/`, Vite): React 19, TanStack Router (file-based
routing + typed search params), TanStack Query, TanStack Table, shadcn/ui on
Base UI, Tailwind CSS v4, Recharts, lucide-react.

## Project structure

```
backend/
  app/
    main.py            FastAPI app instance, CORS, router registration
    config.py           pydantic-settings config, loaded from root .env
    sample_data.py       Multi-season data loading (season -> CSV map, cached)
    dataset_loader.py    CSV/Excel/SQLite readers for backend/datasets/
    analytics/           Pure Polars functions: DataFrame in, dict/DataFrame out
    plots/                mplsoccer figure builders + shared theme
    api/routes/           Thin FastAPI route handlers
  datasets/               Season CSVs + stat-type.json (gitignored, see below)
  tests/                  pytest suite
frontend/
  src/
    routes/               TanStack Router file-based routes
    components/            ui/ (shadcn), layout/, data-table/, cards/, leaderboard/, stat/
    lib/                    cn(), nav config, season/search-param helpers
    hooks/                  useStatGlossary, useLocalStorageState, etc.
    types/                  Ambient TS declarations
docs/
  SETUP.md                 Full setup walkthrough (no database)
  SETUP_WITH_DB.md          How to add persistence later
  screenshots/              README screenshots live here
```

## Getting started

Full step-by-step instructions (prerequisites, verification checklist) are in
[docs/SETUP.md](docs/SETUP.md). In short:

```bash
npm run setup   # installs backend (uv) and frontend (npm) dependencies
cp .env.example .env
npm run dev     # runs both dev servers, colour-prefixed, one command
```

Then open http://localhost:5173.

### Getting the season data

The season CSVs (`backend/datasets/players_data-2024_2025.csv`,
`backend/datasets/players_data-2025_2026.csv`) and the generated
`stat-type.json` glossary are **gitignored** — a fresh clone starts with no
data. See [backend/datasets/README.md](backend/datasets/README.md) for the
expected file format; drop your own season CSVs in that folder to bring the
app to life.

For a persistence layer beyond flat CSVs, see
[docs/SETUP_WITH_DB.md](docs/SETUP_WITH_DB.md).

## License

[MIT](LICENSE)

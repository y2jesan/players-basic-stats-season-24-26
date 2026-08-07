# Football Player Stats Dashboard

A multi-season (2024-25 and 2025-26) football/soccer player statistics
explorer — browse teams, players, and countries across the top 5 European
leagues, compare up to 4 players head-to-head with radar charts, drill into
9 category leaderboards, and look up every stat's meaning in a built-in
glossary. Backend is FastAPI + Polars, frontend is React + TanStack
Router/Query/Table + shadcn/ui.

## Screenshots

<!-- Drop PNGs into docs/screenshots/ using the filenames below and they'll render here automatically. See docs/screenshots/README.md for the full convention. -->

|                                                                                              |                                                                    |
| --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| ![Dashboard](docs/screenshots/dashboard-1.png)                                               | ![Player detail — radar chart + League Percentile view (dark mode)](docs/screenshots/player-details.png) |
| ![Compare Players — overlaid radar charts](docs/screenshots/compare.png)                     | ![Team detail](docs/screenshots/team-details.png)                  |
| ![Leaderboards — index of all 9 categories](docs/screenshots/leaderboards-index.png)         | ![Keeping leaderboard — Per 90 Min view](docs/screenshots/leaderboard.png) |

## Features

- **Season & competition switching** — every page scopes its data to the
  selected season (2024-25 / 2025-26) and competition; switching either
  re-fetches everything downstream.
- **Dashboard** — headline stat cards, a sortable team table and a country
  table for the selected competition/season, plus a 5-card leaderboard
  preview with a "See All" link through to the full Leaderboards page.
- **Team, player, and country detail pages** — full rosters, player profiles
  grouped into stat cards (Match, Shooting, Passing, Creation, Possession,
  Discipline, Keeping, Defending), reached by clicking through from the
  dashboard. Player positions are colour-coded (GK red, defenders orange,
  midfielders green, forwards blue) for fast scanning of rosters and
  leaderboards.
- **Position radar charts** — every player detail page renders a radar chart
  per position the player has played (one per position for multi-position
  players), scoring 6-8 curated stats against every other player at that
  position, with a sample-size caption (e.g. "vs. 1,003 other FWs") and an
  expand-to-fullscreen view.
- **Compare Players** (`/compare`) — pick up to 4 players and see them
  overlaid on the same radar charts (one per stat category: Match, Shooting,
  Passing, Creation, Possession, Discipline, Defending, Misc), plus an
  "Overall" table with Base Stat / League Percentile / Overall Percentile
  tabs that highlights the better value in green for every stat.
- **Base Stat / League Percentile / Overall Percentile views** — player
  detail and comparison pages can switch between raw stat values and a
  percentile rank against the rest of the league or the whole dataset,
  colour-graded from red (bottom) through white (50th) to green (top), so a
  player's strengths and weaknesses jump out at a glance.
- **Per 90 Min toggle** — the player detail page and every leaderboard can
  flip all countable stats (goals, tackles, cards, ...) to their
  per-90-minutes rate on the fly, so playing time doesn't skew comparisons
  between players; rate stats that are already normalized (percentages,
  averages, `/90` stats) are left untouched, and sorting a leaderboard
  column respects whichever mode is active.
- **Leaderboards** (`/leaderboards`) — 9 category leaderboards (Shooting,
  Passing, Defending, Discipline, Keeping, Progression, Pass Accuracy,
  Possession, Creativity) with sortable, hideable columns via a shared
  `DataTable` component and a "Top 100" full-table view per category. A
  "Qualified (900+ min)" toggle filters out small-sample outliers on
  rate-based categories like Keeping's Save% or Pass Accuracy's Cmp%.
- **Advanced-stat highlighting** — expected-value metrics (xG, xAG, xA, GCA,
  SCA, PSxG, ...) are visually flagged wherever they appear, since they're
  only available for seasons whose source data includes them.
- **Stat glossary** — every column gets a short and long description, sourced
  from `backend/datasets/stat-type.json` and surfaced as tooltips throughout
  the app.

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

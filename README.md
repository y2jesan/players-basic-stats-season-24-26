# Football Analytics Boilerplate

A minimal full-stack starting point for football (soccer) analytics projects: a FastAPI +
Polars + mplsoccer backend, and a Vite + React + shadcn/ui frontend with a reusable DataTable.
Clone this for each new project and replace the pieces you need.

## What this is

- A working app you can run in one command, with a dashboard, team/player browsers, a flagship
  data table, and server-rendered pitch plots — all backed by deterministic fake data.
- A set of patterns (the DataTable system, the plot caching layer, the analytics/plots layer
  split) meant to be copied wholesale into real projects.

## What this deliberately does not include

- **No database, no ORM.** `backend/app/sample_data.py` generates everything in memory. See
  [docs/SETUP_WITH_DB.md](docs/SETUP_WITH_DB.md) for how to add one later.
- **No Docker.** Both sides run as plain local processes.
- **No external data provider.** No StatsBombPy, no scrapers, no API keys. All data is either
  local mock JSON (frontend) or generated in Python (backend).
- **No authentication.** There's an `# EXTENSION POINT` comment in `backend/app/main.py` marking
  where auth middleware would go.
- **No network calls at runtime.** Fonts are bundled locally, plots are rendered server-side,
  and the whole app works with no internet connection.

## Request flow

Browser → TanStack Query (frontend data fetching) → Vite dev-server proxy (`/api/*` →
`http://localhost:8000`, dev only) → a FastAPI route in `backend/app/api/routes/` → a pure
function in `backend/app/analytics/` or `backend/app/plots/` → JSON or a PNG response. In
production, FastAPI serves both the built frontend and the API from a single port, so there's no
proxy and no CORS to think about.

## Quick start

See [docs/SETUP.md](docs/SETUP.md) for exact, copy-pasteable commands. In short:

```bash
npm run setup   # installs backend (uv) and frontend (npm) dependencies
npm run dev     # runs both dev servers, colour-prefixed, one command
```

Then open http://localhost:5173.

## Folder-by-folder guide

| Path | What it does | What I should put here |
| --- | --- | --- |
| `package.json` | Root scripts (`dev`, `build`, `start`, `setup`, `test`, `lint`, `format`) that orchestrate both sides via `concurrently`. | New cross-cutting scripts only. Don't add app dependencies here. |
| `.env.example` | Documents every env var the app reads, with safe defaults. | A line for any new config value you add to `backend/app/config.py` or a new `VITE_*` var. |
| `.gitignore` | Keeps `node_modules`, `.venv`, build output, and any files dropped into `backend/datasets/` out of version control. | Add patterns for any new generated/local-only directory. |
| `docs/SETUP.md` | Step-by-step setup and verification for the no-database default path. | Keep in sync if you change setup commands. |
| `docs/SETUP_WITH_DB.md` | How to add DuckDB or PostgreSQL later. Not implemented — reference only. | Update if you actually add persistence, turning this into real docs. |
| `backend/pyproject.toml` | Backend dependencies and metadata, managed by `uv`. | New Python dependencies via `uv add <package>` — don't hand-edit versions. |
| `backend/.python-version` | Pins the interpreter version for `uv`. | Leave alone unless deliberately changing the Python version. |
| `backend/app/main.py` | FastAPI app instance, CORS, router registration, and the production static-file/SPA-fallback mount. | New routers get included here. Auth middleware goes at the `# EXTENSION POINT` comment. |
| `backend/app/config.py` | `pydantic-settings` config, loaded once from the repo-root `.env`. | New environment-driven settings, each with a sane default. |
| `backend/app/sample_data.py` | Deterministic fake data (fixed random seed) — teams, players, matches, shots, touches. **The single place to swap in a real data source.** | Nothing, usually — replace the function bodies here when you plug in real data, keeping the same function signatures. |
| `backend/app/dataset_loader.py` | Thin readers for real data files dropped into `backend/datasets/` — `load_csv`, `load_excel`, `load_sqlite`, each returning a Polars DataFrame and raising `FileNotFoundError` if the file's missing. | New format readers, if you need one beyond CSV/Excel/SQLite. Call these from `sample_data.py`, not from route handlers directly. |
| `backend/datasets/` | Drop real `.csv`/`.xlsx`/`.db`/`.sqlite` files here (gitignored by default). | Your real data files, once you're ready to plug them in via `dataset_loader.py`. |
| `backend/app/analytics/` | Pure Polars functions: DataFrame (and simple params) in, DataFrame/dict out. No FastAPI imports, no file I/O, no plotting. | One function per metric or query. This is what makes metrics testable without starting the server. |
| `backend/app/plots/` | mplsoccer figure builders and the shared theme/colour constants. `render.py` is the only place matplotlib's backend is configured; `pandas_bridge.py` is the only place Polars becomes Pandas. Plots are rendered fresh on every request — no disk cache. | New plot builders (data in, `Figure` out, never touch the filesystem). Reuse `render_png` rather than calling `plt.savefig`/`plt.close` yourself. |
| `backend/app/api/routes/` | Thin FastAPI route handlers that call `sample_data`, `analytics`, and `plots`, and shape the HTTP response. | New endpoints. Keep handlers thin — logic belongs in `analytics/`/`plots/`, not here. |
| `backend/tests/` | pytest suite: health/hello, one analytics function, one plot endpoint, the dataset loader. | A test alongside any new analytics function or endpoint you add. |
| `frontend/package.json` | Frontend dependencies and scripts (`dev`, `build`, `lint`, `preview`). | New frontend dependencies via `npm install`. |
| `frontend/vite.config.ts` | Vite config: Tailwind v4 plugin, TanStack Router codegen plugin (must precede `@vitejs/plugin-react`), the `@` path alias, and the dev-only `/api` proxy. | Rarely touched. New path aliases go in `resolve.alias` and `tsconfig.*.json` together. |
| `frontend/components.json` | shadcn/ui config: style, base library (Base UI), path aliases. | Don't hand-edit — `npx shadcn@latest init` wrote this. |
| `frontend/src/main.tsx` | App entry point: mounts React, wires up TanStack Query's `QueryClient` and TanStack Router's `RouterProvider`. | Rarely touched — global providers only. |
| `frontend/src/routes/` | TanStack Router file-based routes. `__root.tsx` wraps every page in the app shell. | One file per route. Route params/search-state validation lives here, not in the component. |
| `frontend/src/components/ui/` | shadcn/ui primitives, generated by the CLI. | Don't hand-edit — run `npx shadcn@latest add <component>` and let it write here. |
| `frontend/src/components/layout/` | The app shell: sidebar, navbar, `PageHeader`, `Section`. | New shell-level chrome (e.g. a footer) or reusable page-structure components. |
| `frontend/src/components/data-table/` | The reusable DataTable system — the flagship piece. Split into small files: core table, toolbar, pagination, column header, faceted filter, view options, row actions, CSV export. | Extend the shared `DataTable` here if you need a new cross-cutting feature; page-specific column definitions belong in the route file that uses them, not here. |
| `frontend/src/components/cards/` | `StatCard`, `TeamCard`, `PlayerCard`, with loading-skeleton variants. No images anywhere — initials tiles stand in for crests/photos. | New card types for other entity summaries, following the same no-image, skeleton-variant pattern. |
| `frontend/src/lib/` | Small framework-agnostic helpers: `cn()`, nav config, URL search-param (de)serialization, initials/colour hashing. | Pure utility functions with no React or route dependencies. |
| `frontend/src/hooks/` | `useTheme`, `useClock`, `useControllableState`, `useLocalStorageState` — small reusable React hooks. | New cross-page hooks. Page-specific state stays in the route file. |
| `frontend/src/mocks/` | Local JSON fixtures for the three mock-data pages: teams, players, matches, season trend. | Replace or extend with your own realistic fixtures — keep shapes consistent so `typeof` inference keeps working. |
| `frontend/src/styles/globals.css` | The one global stylesheet: Tailwind v4 import, the design-token `:root`/`.dark` blocks, the `@theme inline` mapping. **Source of truth for `backend/app/plots/theme.py`.** | Design tokens only. Component styling stays in Tailwind classes on the component. |
| `frontend/src/types/` | Ambient TypeScript declarations (e.g. typing TanStack Table's `column.meta`). | Module augmentations only — not regular application types, which should be inferred from data with `typeof`. |

## How do I add…

**…a new API endpoint?** Add a route function to an existing (or new) file in
`backend/app/api/routes/`, register it in `backend/app/main.py` if it's a new router, and pull
data via `sample_data.py` + a function in `analytics/`. Keep the handler `def`, not `async def`.

**…a new analytics metric?** Add a pure function to `backend/app/analytics/` — Polars DataFrame
in, DataFrame or dict out. Write a test against a tiny hand-built DataFrame fixture (see
`backend/tests/test_analytics.py`), then call it from a route handler.

**…a new plot?** Add a builder function to `backend/app/plots/` (data in, `Figure` out, using
`app.plots.theme` for colours), then wire a route in `plots.py` that calls the builder and passes
the resulting `Figure` to `render_png(fig)`, returning the bytes as a `Response(media_type=
"image/png")`. Never call `plt.savefig`/`plt.close` yourself — that's what `render_png` is for.

**…a new page?** Add a file to `frontend/src/routes/` — the router picks it up automatically.
Wrap it in `PageHeader`/`Section`, and reach for `DataTable` if it needs a table.

**…a new table?** Import `DataTable` from `frontend/src/components/data-table/data-table.tsx`,
define your `ColumnDef[]` in the route file, and pick `mode="client"` (all data loaded upfront)
or `mode="server"` (you own fetching, keyed off the table's controlled state — see
`frontend/src/routes/analysis.tsx` for a full server-mode example, or `players.tsx` for
client-mode with every feature turned on).

**…a new shadcn component?** From `frontend/`, run `npx shadcn@latest add <component>`. It
writes into `src/components/ui/` using the project's existing style/base-library config.

## How do I plug in real data

`backend/app/sample_data.py` is the single file to replace. It exports four functions —
`get_teams()`, `get_players()`, `get_matches()`, `get_shots(match_id)`, plus
`get_player_touches(player_id)` for the heatmap — each returning a Polars DataFrame. Every route
handler calls only these functions, never reads data directly, so as long as your replacement
keeps the same function signatures and column names, nothing else in the app needs to change.

Likely sources, in rough order of effort:

- **A CSV, Excel, or SQLite export** from whatever spreadsheet or tool you're already using — drop
  the file into `backend/datasets/` and read it with `load_csv`/`load_excel`/`load_sqlite` from
  `backend/app/dataset_loader.py`, called from `sample_data.py`.
- **StatsBomb open data** (free, well-documented, event-level) — good for a realistic shot map.
- **An FBref scrape** — season stats and standings, no official API, so respect their terms.
- **A database** — see [docs/SETUP_WITH_DB.md](docs/SETUP_WITH_DB.md) once you need persistence
  or multi-user writes rather than a read-only data source.

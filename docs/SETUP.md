# Setup (no database — the default path)

This is the default path for this boilerplate: no database, no Docker, everything running as
plain local processes. Follow this top to bottom on a clean machine.

## Prerequisites

- **Python 3.14** — install via [uv](https://docs.astral.sh/uv/) (recommended) or from
  [python.org](https://www.python.org/downloads/).
- **Node 20+** and npm.
- **[uv](https://docs.astral.sh/uv/getting-started/installation/)** — manages the Python
  interpreter and virtual environment for the backend.

Check what you have:

```bash
node --version   # v20 or newer
uv --version     # any recent 0.x
```

If you don't have Python 3.14 yet, `uv` will fetch it automatically on first `uv sync` — no
separate install step needed.

## One-time setup

From the repository root:

```bash
npm run setup
```

This runs, in order:

1. `cd backend && uv sync` — creates `backend/.venv`, resolves and installs every dependency in
   `backend/pyproject.toml` (pinned to Python 3.14 via `backend/.python-version`).
2. `cd frontend && npm install` — installs the frontend dependencies into
   `frontend/node_modules`.

Then copy the environment template:

```bash
cp .env.example .env
```

Edit `.env` if you want a different `VITE_LOCATION_LABEL` or backend port — the defaults work
as-is.

**If a dependency doesn't have a Python 3.14 wheel:** `uv sync` will stop and tell you rather than
silently building from source or downgrading. If that happens, decide whether to wait for an
upstream wheel or drop `backend/.python-version` to `3.13`.

## Running in development

From the repository root:

```bash
npm run dev
```

This starts both servers with one command, colour-prefixed in the same terminal:

- **backend** — `uvicorn` with `--reload`, on `http://localhost:8000`
- **frontend** — the Vite dev server, on `http://localhost:5173`

Open **http://localhost:5173**. The dashboard should load and show a live greeting fetched from
`/api/hello` — Vite proxies `/api/*` to the backend in dev, so there's no CORS to configure.

To stop both servers, `Ctrl+C` once in the terminal running `npm run dev`.

## Running in production

Build the frontend, then start the single backend process that serves everything:

```bash
npm run build   # tsc + vite build -> frontend/dist
npm start       # uvicorn, serving the API and the built frontend on one port
```

Open **http://localhost:8000** — the whole app, API included, is served from this one port. A
hard refresh on a deep link (e.g. `http://localhost:8000/players`) should load correctly; FastAPI's
catch-all route serves `index.html` for any path that isn't `/api/*`, so client-side routing
survives a full page reload.

## Verifying everything works

- [ ] `npm run setup` completes with no errors on a clean checkout.
- [ ] `npm run dev` starts both servers; the dashboard shows the live greeting.
- [ ] The navbar clock ticks every second; toggling dark/light mode looks clean on every page.
- [ ] The Players page table sorts (try shift-click on two column headers), filters, paginates,
      and its URL updates — reloading the browser restores the exact same view.
- [ ] The Analysis page loads a server-paginated table and both plot images.
- [ ] `npm run test` and `npm run lint` both pass.
- [ ] `npm run build && npm start`, then a hard refresh on `/players` still works.
- [ ] Disconnect from the internet — the app still works end to end.

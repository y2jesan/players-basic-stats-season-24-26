# docs/screenshots/

Screenshots referenced by the root `README.md`. Drop PNGs in here using the
filenames below and they'll show up in the README automatically — no other
edit needed.

| Filename | Page |
| --- | --- |
| `dashboard.png` | Dashboard (`/`) — season/competition pickers, stat cards, team table |
| `player-detail.png` | Player detail (`/players/$playerId`) — profile header + stat cards |
| `team-detail.png` | Team detail (`/teams/$teamId`) — roster table |
| `leaderboard-shooting.png` | A leaderboard page (`/leaderboards/shooting`) |
| `glossary.png` | Stat glossary (`/glossary`) |

Add more using the same `<page>-<detail>.png` pattern (e.g.
`country-detail.png`, `leaderboard-passing.png`) and link them from the README
as you go.

## Capture conventions

- Browser viewport ~1440px wide, light mode, real (non-empty) data loaded.
- PNG format, trimmed to the page content (no browser chrome).

## Automating capture later

A future session can regenerate these headlessly instead of by hand: start
both dev servers (`npm run dev`), drive a headless Chromium instance (e.g.
`playwright-core` pointed at a locally cached Chromium build) through each
route, and save a full-page screenshot per route into this folder using the
filenames above.

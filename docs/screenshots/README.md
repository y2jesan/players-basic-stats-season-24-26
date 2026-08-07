# docs/screenshots/

Screenshots referenced by the root `README.md`. Drop PNGs in here using the
filenames below and they'll show up in the README automatically — no other
edit needed.

| Filename | Page |
| --- | --- |
| `dashboard-1.png` | Dashboard (`/`) — season/competition pickers, stat cards, 5-card leaderboard preview, team table. Light mode, first viewport only. |
| `player-details.png` | Player detail (`/players/$playerId`) — profile header + position radar chart + stat cards, captured in League Percentile view to show the red-to-green percentile colouring. Dark mode, first viewport only. |
| `compare.png` | Compare Players (`/compare`) — 3 players overlaid on the per-category radar charts. Light mode, first viewport only. |
| `team-details.png` | Team detail (`/teams/$teamId`) — roster table with colour-coded position badges. Light mode, first viewport only. |
| `leaderboards-index.png` | Leaderboards index (`/leaderboards`) — all 9 category cards. Light mode, first viewport only. |
| `leaderboard.png` | A leaderboard detail page (`/leaderboards/keeping`), captured with the Per 90 Min toggle on. Light mode, first viewport only. |
| `glossary.png` | Stat glossary (`/glossary`) |

Add more using the same `<page>-<detail>.png` pattern (e.g.
`country-detail.png`, `leaderboard-passing.png`) and link them from the README
as you go.

## Capture conventions

- Browser viewport ~1440px wide, real (non-empty) data loaded.
- **First viewport only, no scrolling** — GitHub renders README images at a
  fixed width regardless of source height, so a tall full-page capture just
  gets awkwardly squashed. Crop to what's visible on load.
- Mix of light/dark mode across the set is fine and intentional — pick
  whichever best shows off the page in question (e.g. percentile colour
  grading pops more in dark mode).
- PNG format, trimmed to the page content (no browser chrome).

## Automating capture later

A future session can regenerate these headlessly instead of by hand: start
both dev servers (`npm run dev`), drive a headless Chromium instance (e.g.
`playwright-core` pointed at a locally cached Chromium build) through each
route, and save a full-page screenshot per route into this folder using the
filenames above.

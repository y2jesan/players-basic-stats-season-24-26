# docs/screenshots/

Screenshots referenced by the root `README.md`. Drop PNGs in here using the
filenames below and they'll show up in the README automatically — no other
edit needed.

| Filename | Page |
| --- | --- |
| `dashboard-1.png` | Dashboard (`/`) — season/competition pickers, stat cards, team table. Captured in dark mode, first viewport only (no scrolling). |
| `player-details.png` | Player detail (`/players/$playerId`) — profile header + stat cards, captured in League Percentile view to show the red-to-green percentile colouring. Dark mode, full page. |
| `team-details.png` | Team detail (`/teams/$teamId`) — roster table with colour-coded position badges. Light mode, full page. |
| `leaderboard.png` | A leaderboard page (`/leaderboards/shooting`), captured with the Per 90 Min toggle on. Light mode, first viewport only (no scrolling). |
| `glossary.png` | Stat glossary (`/glossary`) |

Add more using the same `<page>-<detail>.png` pattern (e.g.
`country-detail.png`, `leaderboard-passing.png`) and link them from the README
as you go.

## Capture conventions

- Browser viewport ~1440px wide, real (non-empty) data loaded.
- Mix of light/dark mode and full-page/first-viewport-only across the set is
  fine and intentional — pick whichever best shows off the page in question
  (e.g. a tall table looks better as a viewport-only crop than scrolled in
  full, since GitHub renders README images at a fixed width regardless of
  source height).
- PNG format, trimmed to the page content (no browser chrome).

## Automating capture later

A future session can regenerate these headlessly instead of by hand: start
both dev servers (`npm run dev`), drive a headless Chromium instance (e.g.
`playwright-core` pointed at a locally cached Chromium build) through each
route, and save a full-page screenshot per route into this folder using the
filenames above.

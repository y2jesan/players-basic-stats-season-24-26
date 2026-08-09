// Shared query-string helpers for the season-scoped /api/football/* endpoints.

export function seasonParams(season?: string) {
  const params = new URLSearchParams()
  if (season) params.set("season", season)
  return params
}

export function scopeParams(season?: string, competition?: string) {
  const params = seasonParams(season)
  if (competition) params.set("competition", competition)
  return params
}

export function formatSeasonLabel(season: string) {
  return season.replace("-", "/")
}

// "2024-2025" -> "24/25" — used where the navbar's season picker has to fit next to
// the search box, nav links, and theme toggle on very narrow viewports.
export function formatSeasonShort(season: string) {
  return season
    .split("-")
    .map((year) => year.slice(-2))
    .join("/")
}

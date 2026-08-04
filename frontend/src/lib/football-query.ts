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

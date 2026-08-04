// Kept as a plain parse function (no schema library), mirroring table-search-params.ts.
export type SeasonSearch = { season?: string }

export function validateSeasonSearch(search: Record<string, unknown>): SeasonSearch {
  return { season: typeof search.season === "string" ? search.season : undefined }
}

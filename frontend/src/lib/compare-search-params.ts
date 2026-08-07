// Kept as a plain parse function (no schema library), mirroring season-search-params.ts.
export type CompareSearch = { season?: string; p1?: string; p2?: string; p3?: string; p4?: string }

export const COMPARE_SLOT_KEYS = ["p1", "p2", "p3", "p4"] as const
export type CompareSlotKey = (typeof COMPARE_SLOT_KEYS)[number]

export function validateCompareSearch(search: Record<string, unknown>): CompareSearch {
  const str = (key: string) => (typeof search[key] === "string" ? (search[key] as string) : undefined)
  return {
    season: str("season"),
    p1: str("p1"),
    p2: str("p2"),
    p3: str("p3"),
    p4: str("p4"),
  }
}

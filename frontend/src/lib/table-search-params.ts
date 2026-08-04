import type { ColumnFiltersState, SortingState } from "@tanstack/react-table"

// Compact query-string encoding for DataTable state, e.g. "goals.desc,name.asc" and "position:FW|MF,teamName:Arsenal".
// Kept as plain parse/serialize functions (no schema library) per the "TS kept basic" constraint.
export type TableSearch = {
  sort?: string
  filters?: string
  q?: string
  page?: number
  size?: number
}

export function validateTableSearch(search: Record<string, unknown>): TableSearch {
  return {
    sort: typeof search.sort === "string" ? search.sort : undefined,
    filters: typeof search.filters === "string" ? search.filters : undefined,
    q: typeof search.q === "string" ? search.q : undefined,
    page: Number.isFinite(Number(search.page)) && search.page !== undefined ? Number(search.page) : undefined,
    size: Number.isFinite(Number(search.size)) && search.size !== undefined ? Number(search.size) : undefined,
  }
}

export function parseSortParam(sort?: string): SortingState {
  if (!sort) return []
  return sort
    .split(",")
    .filter(Boolean)
    .map((part) => {
      const [id, dir] = part.split(".")
      return { id, desc: dir === "desc" }
    })
}

export function serializeSortParam(sorting: SortingState): string | undefined {
  if (!sorting.length) return undefined
  return sorting.map((s) => `${s.id}.${s.desc ? "desc" : "asc"}`).join(",")
}

export function parseFiltersParam(filters?: string): ColumnFiltersState {
  if (!filters) return []
  return filters
    .split(",")
    .filter(Boolean)
    .map((part) => {
      const [id, values] = part.split(":")
      return { id, value: values ? values.split("|") : [] }
    })
}

export function serializeFiltersParam(filters: ColumnFiltersState): string | undefined {
  if (!filters.length) return undefined
  return filters
    .map((f) => `${f.id}:${(Array.isArray(f.value) ? f.value : [f.value]).join("|")}`)
    .join(",")
}

import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import { apiGet } from "@/lib/api"
import type { StatGlossaryEntry } from "@/types/football"

// Static reference data (every dataset column's description) — fetched once and cached
// for the life of the app; used both for column-header tooltips and the glossary page.
export function useStatGlossary() {
  const { data, isLoading } = useQuery({
    queryKey: ["football-stat-glossary"],
    queryFn: () => apiGet<StatGlossaryEntry[]>("/api/football/stat-glossary"),
    staleTime: Number.POSITIVE_INFINITY,
  })

  const byProperty = useMemo(() => new Map((data ?? []).map((entry) => [entry.property, entry])), [data])

  return { entries: data, byProperty, isLoading }
}

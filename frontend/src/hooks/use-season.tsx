import type { ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter, useRouterState } from "@tanstack/react-router"
import { createContext, useContext, useEffect, useRef } from "react"

import { useLocalStorageState } from "@/hooks/use-local-storage-state"
import { apiGet } from "@/lib/api"
import type { Season } from "@/types/football"

type SeasonContextValue = {
  season: string
  setSeason: (season: string) => void
  seasons: Season[] | undefined
  isLoading: boolean
}

const SeasonContext = createContext<SeasonContextValue | null>(null)

// Global season selection, persisted to localStorage (mirrors useTheme) and kept in sync with the
// current route's ?season= search param in both directions: a shared link's ?season= wins on
// entry, and changing the season anywhere (setSeason) updates the current page's URL to match.
//
// setSeason pushes to the URL directly, right when it's called, rather than reactively via an
// effect watching for a season/URL mismatch — two effects both trying to reconcile the same
// mismatch in opposite directions would ping-pong forever (the URL update from setSeason is
// asynchronous, so a "URL differs from context, adopt the URL" effect would immediately undo the
// very change setSeason just made, before the URL had even caught up).
export function SeasonProvider({ children }: { children: ReactNode }) {
  const [season, setStoredSeason] = useLocalStorageState<string>("football-season", "")
  const router = useRouter()
  const urlSeason = useRouterState({
    select: (s) => {
      const value = (s.location.search as Record<string, unknown>).season
      return typeof value === "string" ? value : undefined
    },
  })

  const { data: seasons, isLoading } = useQuery({
    queryKey: ["football-seasons"],
    queryFn: () => apiGet<Season[]>("/api/football/seasons"),
  })

  const setSeason = (next: string) => {
    setStoredSeason(next)
    router.navigate({ to: ".", search: (prev: Record<string, unknown>) => ({ ...prev, season: next }), replace: true })
  }

  // Reconcile the active season against the URL, in one effect (not two independent ones — two
  // effects each reading `season` from the same stale, pre-update render would race each other and
  // clobber one another's result). Edge-triggered on urlSeason actually *changing* value (a shared
  // link, browser back/forward, or the initial load), not merely differing from `season` — that's
  // what keeps this from fighting with setSeason's own direct URL push above.
  const prevUrlSeasonRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (!seasons?.length) return
    const urlChanged = urlSeason !== prevUrlSeasonRef.current
    prevUrlSeasonRef.current = urlSeason

    if (urlChanged && urlSeason && urlSeason !== season && seasons.some((s) => s.id === urlSeason)) {
      setStoredSeason(urlSeason)
      return
    }

    if (season && seasons.some((s) => s.id === season)) {
      if (urlSeason !== season) setSeason(season)
      return
    }
    setSeason((seasons.find((s) => s.is_default) ?? seasons[0]).id)
  }, [seasons, urlSeason, season, setStoredSeason])

  return <SeasonContext.Provider value={{ season, setSeason, seasons, isLoading }}>{children}</SeasonContext.Provider>
}

export function useSeason() {
  const ctx = useContext(SeasonContext)
  if (!ctx) throw new Error("useSeason must be used within a SeasonProvider")
  return ctx
}

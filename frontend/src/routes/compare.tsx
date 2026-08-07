import type { UseQueryResult } from "@tanstack/react-query"
import { useQueries, useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useRouter } from "@tanstack/react-router"
import { Plus, X } from "lucide-react"
import { useMemo, useState } from "react"

import { PageHeader } from "@/components/layout/page-header"
import { POSITION_COLORS, PositionBadge } from "@/components/player/position-badge"
import { ChartExpandDialog } from "@/components/stat/chart-expand-dialog"
import { PositionRadarChart, type RadarSeries } from "@/components/stat/position-radar-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { useSeason } from "@/hooks/use-season"
import { apiGet } from "@/lib/api"
import { COMPARE_SLOT_KEYS, type CompareSlotKey, validateCompareSearch } from "@/lib/compare-search-params"
import { formatSeasonLabel, seasonParams } from "@/lib/football-query"
import { getInitials, initialsTileStyle } from "@/lib/initials-color"
import { cn } from "@/lib/utils"
import type { PlayerDetail, PlayerSearchResult, RadarAxis, StatEntry } from "@/types/football"

type DisplayMode = "base" | "league" | "overall"

// Radar axes per category chart are capped at this many stats (the first N encountered,
// which — since each player's own `card.stats` is already priority-sorted server-side —
// means "the N most important stats in this category", not an arbitrary subset).
const MAX_CATEGORY_AXES = 8

export const Route = createFileRoute("/compare")({
  validateSearch: validateCompareSearch,
  component: ComparePage,
})

// Overlay colors for the compare page's radar/legend — deliberately independent of
// position hue (POSITION_COLORS), since a slot's player can be any position and two
// slots overlapping in the same radar still need to read as distinct.
const SLOT_COLORS = ["#6366f1", "#ec4899", "#14b8a6", "#f59e0b"]

// Shared column template for the player-picker row and every row of the "Overall"
// table below it — a fixed label column plus one column per compare slot. Using the
// exact same template string in both places (rather than a <table>, whose column
// widths auto-size from content and won't reliably match a sibling grid) is what
// guarantees player N's picker card sits directly above player N's stat column.
const COMPARE_COLS = "grid min-w-[900px] grid-cols-[12rem_repeat(4,minmax(0,1fr))] items-center gap-4"

type Slot = {
  key: CompareSlotKey
  playerId?: string
  query: UseQueryResult<PlayerDetail>
  color: string
}

function ComparePage() {
  const search = Route.useSearch()
  const router = useRouter()
  const { season } = useSeason()
  const [displayMode, setDisplayMode] = useState<DisplayMode>("base")
  useDocumentTitle("Compare Players")

  const queries = useQueries({
    queries: COMPARE_SLOT_KEYS.map((key) => {
      const playerId = search[key]
      return {
        queryKey: ["football-player", playerId, season],
        queryFn: () => apiGet<PlayerDetail>(`/api/football/players/${playerId}?${seasonParams(season)}`),
        enabled: Boolean(playerId),
      }
    }),
  })

  const slots: Slot[] = COMPARE_SLOT_KEYS.map((key, i) => ({
    key,
    playerId: search[key],
    query: queries[i],
    color: SLOT_COLORS[i],
  }))
  const excludeIds = slots.map((s) => s.playerId).filter((id): id is string => Boolean(id))
  const filled = slots.filter((s) => s.playerId && s.query.data) as (Slot & { query: { data: PlayerDetail } })[]

  function setSlot(key: CompareSlotKey, playerId: string | undefined) {
    router.navigate({ to: ".", search: (prev) => ({ ...prev, [key]: playerId }), replace: true })
  }

  const cardTypes = useMemo(() => {
    const seen = new Map<string, string>()
    for (const s of filled) {
      for (const card of s.query.data.cards) {
        if (!seen.has(card.type)) seen.set(card.type, card.label)
      }
    }
    return Array.from(seen, ([type, label]) => ({ type, label }))
  }, [filled])

  // One radar per stat category present among the filled players (Shooting, Passing,
  // Defending, ...), each overlaying every filled player regardless of position — a
  // broader "compare every aspect" view, distinct from the player detail page's single
  // curated per-position radar. Reuses each stat's already-computed `overall_percentile`
  // directly (no extra backend call), so a player missing a given category/stat just
  // renders as a null axis (handled gracefully by PositionRadarChart already).
  const categoryCharts = useMemo(() => {
    return cardTypes.map(({ type, label }) => {
      const seen = new Map<string, string>()
      for (const s of filled) {
        const card = s.query.data.cards.find((c) => c.type === type)
        for (const stat of card?.stats ?? []) {
          if (!seen.has(stat.key)) seen.set(stat.key, stat.label)
        }
      }
      const statKeys = Array.from(seen.keys()).slice(0, MAX_CATEGORY_AXES)

      const series: RadarSeries[] = filled.map((s) => {
        const card = s.query.data.cards.find((c) => c.type === type)
        const axes: RadarAxis[] = statKeys.map((key) => {
          const stat = card?.stats.find((st) => st.key === key)
          return stat
            ? { key: stat.key, label: stat.label, value: stat.value, percentile: stat.overall_percentile }
            : { key, label: seen.get(key) ?? key, value: null, percentile: null }
        })
        return { id: s.key, label: s.query.data.profile.name, color: s.color, chart: { position: type, sample_size: 0, axes } }
      })

      return { type, label, series }
    })
  }, [cardTypes, filled])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Compare Players"
        description={`Comparing up to 4 players, ${formatSeasonLabel(season ?? "")} season.`}
      />

      <div className="overflow-x-auto">
        <div className={cn(COMPARE_COLS, "pb-1")}>
          <div />
          {slots.map((slot) => (
            <PlayerSlotCard
              key={slot.key}
              season={season}
              playerId={slot.playerId}
              data={slot.query.data}
              isLoading={slot.query.isLoading}
              isError={slot.query.isError}
              excludeIds={excludeIds}
              color={slot.color}
              onSelect={(id) => setSlot(slot.key, id)}
              onRemove={() => setSlot(slot.key, undefined)}
            />
          ))}
        </div>
      </div>

      {filled.length === 0 && (
        <p className="text-muted-foreground text-sm">Add at least one player above to start comparing.</p>
      )}

      {categoryCharts.length > 0 && (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-4">
          {categoryCharts.map(({ type, label, series }) => (
            <div key={type} className="flex flex-col items-center gap-1">
              <div className="flex w-72 items-center justify-between">
                <h3 className="text-sm font-semibold">{label}</h3>
                <ChartExpandDialog title={`${label} — Comparison`} series={series} />
              </div>
              <PositionRadarChart series={series} />
            </div>
          ))}
        </div>
      )}

      {filled.length > 0 && (
        <Card className="overflow-hidden py-0">
          <CardHeader className="flex flex-wrap items-center justify-between gap-3 border-b pt-4">
            <CardTitle>Overall</CardTitle>
            <Tabs value={displayMode} onValueChange={(value) => setDisplayMode(value as DisplayMode)}>
              <TabsList>
                <TabsTrigger value="base">
                  <span className="sm:hidden">Base</span>
                  <span className="hidden sm:inline">Base Stat</span>
                </TabsTrigger>
                <TabsTrigger value="league">
                  <span className="sm:hidden">League</span>
                  <span className="hidden sm:inline">League Percentile</span>
                </TabsTrigger>
                <TabsTrigger value="overall">
                  <span className="sm:hidden">Overall</span>
                  <span className="hidden sm:inline">Overall Percentile</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="overflow-x-auto px-0 pb-0">
            <div className={cn(COMPARE_COLS, "border-b px-4 py-3 text-sm font-medium")}>
              <span>Stat</span>
              {slots.map((s) => (
                <span key={s.key} className="truncate">
                  {s.query.data?.profile.name ?? "—"}
                </span>
              ))}
            </div>
            {cardTypes.map(({ type, label }) => (
              <StatCardRows key={type} type={type} label={label} slots={slots} mode={displayMode} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Which stat wins a row is always decided by percentile (higher = better, already
// direction-corrected server-side for "lower is better" stats like cards/fouls) even
// in Base Stat mode, where the *displayed* number is the raw value — a raw value alone
// doesn't say whether higher or lower is better, but its percentile does.
function rankValue(stat: StatEntry | undefined, mode: DisplayMode): number | null {
  if (!stat) return null
  return mode === "league" ? stat.league_percentile : stat.overall_percentile
}

function displayValue(stat: StatEntry, mode: DisplayMode): string | number {
  if (mode === "base") return stat.value
  const percentile = mode === "league" ? stat.league_percentile : stat.overall_percentile
  return percentile ?? stat.value
}

function StatCardRows({
  type,
  label,
  slots,
  mode,
}: {
  type: string
  label: string
  slots: Slot[]
  mode: DisplayMode
}) {
  const statKeys = useMemo(() => {
    const seen = new Map<string, string>()
    for (const s of slots) {
      const card = s.query.data?.cards.find((c) => c.type === type)
      for (const stat of card?.stats ?? []) {
        if (!seen.has(stat.key)) seen.set(stat.key, stat.label)
      }
    }
    return Array.from(seen, ([key, statLabel]) => ({ key, statLabel }))
  }, [slots, type])

  return (
    <>
      <div className={cn(COMPARE_COLS, "bg-muted/40 px-4 py-1.5")}>
        <span className="text-muted-foreground col-span-full text-xs font-semibold">{label}</span>
      </div>
      {statKeys.map(({ key, statLabel }) => {
        const stats = slots.map((s) => s.query.data?.cards.find((c) => c.type === type)?.stats.find((st) => st.key === key))
        const ranks = stats.map((stat) => rankValue(stat, mode)).filter((r): r is number => r !== null)
        const best = ranks.length > 1 ? Math.max(...ranks) : null

        return (
          <div key={key} className={cn(COMPARE_COLS, "border-b px-4 py-1.5 last:border-b-0")}>
            <span className="text-muted-foreground text-xs">{statLabel}</span>
            {slots.map((s, i) => {
              const stat = stats[i]
              if (!stat) {
                return (
                  <span key={s.key} className="text-muted-foreground text-sm">
                    —
                  </span>
                )
              }
              const isWinner = best !== null && rankValue(stat, mode) === best
              return (
                <span
                  key={s.key}
                  className={cn(
                    "text-sm font-medium tabular-nums",
                    isWinner && "text-green-600 font-semibold dark:text-green-400"
                  )}
                >
                  {displayValue(stat, mode)}
                </span>
              )
            })}
          </div>
        )
      })}
    </>
  )
}

function PlayerSlotCard({
  season,
  playerId,
  data,
  isLoading,
  isError,
  excludeIds,
  color,
  onSelect,
  onRemove,
}: {
  season?: string
  playerId?: string
  data?: PlayerDetail
  isLoading: boolean
  isError: boolean
  excludeIds: string[]
  color: string
  onSelect: (playerId: string) => void
  onRemove: () => void
}) {
  if (!playerId) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex h-full min-h-36 items-center justify-center p-4">
          <PlayerSearchCombobox season={season} excludeIds={excludeIds} onSelect={onSelect} />
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card className="border-destructive/40">
        <CardContent className="flex items-center justify-between p-4 text-sm">
          <span>Player not found</span>
          <Button variant="ghost" size="icon-sm" onClick={onRemove}>
            <X className="size-4" />
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isLoading || !data) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-2 p-4">
          <Skeleton className="size-10 rounded-lg" />
          <Skeleton className="h-4 w-24" />
        </CardContent>
      </Card>
    )
  }

  const { profile } = data

  return (
    <Card style={{ borderTopColor: color, borderTopWidth: 3 }}>
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
              style={initialsTileStyle(profile.name)}
            >
              {getInitials(profile.name)}
            </div>
            <div className="flex flex-col">
              <Link
                to="/players/$playerId"
                params={{ playerId: profile.player_id }}
                search={{ season: profile.season }}
                className="hover:text-primary text-sm font-medium underline-offset-2 hover:underline"
              >
                {profile.name}
              </Link>
              <span className="text-muted-foreground text-xs">{profile.team_name}</span>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onRemove}>
            <X className="size-4" />
          </Button>
        </div>
        <div className="flex gap-1">
          {profile.positions.map((pos) => (
            <PositionBadge key={pos} position={pos} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function PlayerSearchCombobox({
  season,
  excludeIds,
  onSelect,
}: {
  season?: string
  excludeIds: string[]
  onSelect: (playerId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const { data, isFetching } = useQuery({
    queryKey: ["player-search", query, season],
    queryFn: () =>
      apiGet<PlayerSearchResult[]>(`/api/football/players/search?q=${encodeURIComponent(query)}&${seasonParams(season)}`),
    enabled: open && query.trim().length > 1,
  })

  const results = (data ?? []).filter((p) => !excludeIds.includes(p.player_id))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="outline" className="w-full border-dashed" />}>
        <Plus className="size-4" />
        Add player
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search players..." value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>
              {query.trim().length <= 1 ? "Type at least 2 characters." : isFetching ? "Searching…" : "No players found."}
            </CommandEmpty>
            <CommandGroup>
              {results.map((p) => (
                <CommandItem
                  key={p.player_id}
                  value={p.player_id}
                  onSelect={() => {
                    onSelect(p.player_id)
                    setOpen(false)
                    setQuery("")
                  }}
                >
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="text-muted-foreground shrink-0 text-xs">{p.team_name}</span>
                  {p.positions.map((pos) => (
                    <span
                      key={pos}
                      className="shrink-0 rounded px-1 py-0.5 text-[0.65rem] font-medium"
                      style={{ backgroundColor: `${POSITION_COLORS[pos]}26`, color: POSITION_COLORS[pos] }}
                    >
                      {pos}
                    </span>
                  ))}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

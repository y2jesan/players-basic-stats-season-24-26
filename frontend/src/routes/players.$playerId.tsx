import type { LucideIcon } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import {
  ArrowLeftRight,
  CalendarCheck2,
  CircleX,
  Footprints,
  Goal,
  Handshake,
  Move,
  RectangleVertical,
  Sparkles,
  Target,
} from "lucide-react"
import { useState } from "react"

import { PageHeader } from "@/components/layout/page-header"
import { AdvancedStatIndicator } from "@/components/stat/advanced-stat-indicator"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { useSeason } from "@/hooks/use-season"
import { useStatGlossary } from "@/hooks/use-stat-glossary"
import { apiGet } from "@/lib/api"
import { formatSeasonLabel, seasonParams } from "@/lib/football-query"
import { getInitials, initialsTileStyle } from "@/lib/initials-color"
import { percentileColor } from "@/lib/percentile-color"
import { validateSeasonSearch } from "@/lib/season-search-params"
import { cn } from "@/lib/utils"
import type { PlayerDetail, StatEntry } from "@/types/football"

type DisplayMode = "base" | "league" | "overall"

export const Route = createFileRoute("/players/$playerId")({
  validateSearch: validateSeasonSearch,
  component: PlayerDetailPage,
})

const STAT_ICONS: Record<string, { icon: LucideIcon; className?: string }> = {
  MP: { icon: CalendarCheck2 },
  Gls: { icon: Goal },
  Ast: { icon: Handshake },
  PK: { icon: Target },
  PKatt: { icon: Target },
  PKm: { icon: CircleX },
  CrdY: { icon: RectangleVertical, className: "fill-yellow-400 text-yellow-500" },
  CrdR: { icon: RectangleVertical, className: "fill-red-500 text-red-600" },
  Subs: { icon: ArrowLeftRight },
  GCA: { icon: Sparkles },
  Touches: { icon: Footprints },
  Carries: { icon: Move },
}

function statDisplay(stat: StatEntry, mode: DisplayMode): { text: string | number; color?: string } {
  if (mode === "base") return { text: stat.value }
  const percentile = mode === "league" ? stat.league_percentile : stat.overall_percentile
  if (percentile === null) return { text: stat.value }
  return { text: percentile, color: percentileColor(percentile) }
}

function PlayerDetailPage() {
  const { playerId } = Route.useParams()
  const { season } = useSeason()
  const { byProperty: glossary } = useStatGlossary()
  const [displayMode, setDisplayMode] = useState<DisplayMode>("base")

  const { data, isLoading, isError } = useQuery({
    queryKey: ["football-player", playerId, season],
    queryFn: () => apiGet<PlayerDetail>(`/api/football/players/${playerId}?${seasonParams(season)}`),
  })

  const profile = data?.profile

  useDocumentTitle(isError ? "Player not found" : profile?.name)

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Player not found" description="This player doesn't exist in the current dataset." />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={
          isLoading || !profile ? (
            <div className="flex items-center gap-3">
              <Skeleton className="size-12 shrink-0 rounded-lg" />
              <Skeleton className="h-7 w-40" />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div
                className="flex size-12 shrink-0 items-center justify-center rounded-lg text-base font-semibold text-white"
                style={initialsTileStyle(profile.name)}
              >
                {getInitials(profile.name)}
              </div>
              <div className="flex flex-col gap-1.5">
                <span>{profile.name}</span>
                <div className="flex gap-1">
                  {profile.positions.map((pos) => (
                    <Badge key={pos} variant="secondary">
                      {pos}
                    </Badge>
                  ))}
                  <Badge variant="outline">{formatSeasonLabel(profile.season)}</Badge>
                </div>
              </div>
            </div>
          )
        }
        description={
          profile ? (
            <span>
              {profile.team_name ? (
                <Link
                  to="/teams/$teamId"
                  params={{ teamId: profile.team_id }}
                  search={{ season: profile.season }}
                  className="hover:text-foreground underline underline-offset-2"
                >
                  {profile.team_name}
                </Link>
              ) : null}
              {profile.competition?.name ? ` · ${profile.competition.name}` : ""}
              {profile.nation ? (
                <>
                  {" · "}
                  <Link
                    to="/countries/$countryCode"
                    params={{ countryCode: profile.nation.code }}
                    search={{ season: profile.season }}
                    className="hover:text-foreground underline underline-offset-2"
                  >
                    {profile.nation.name}
                  </Link>
                </>
              ) : null}
              {profile.age ? ` · ${profile.age} yrs` : ""}
            </span>
          ) : undefined
        }
        actions={
          <Tabs value={displayMode} onValueChange={(value) => setDisplayMode(value as DisplayMode)}>
            <TabsList>
              <TabsTrigger value="base">Base Stat</TabsTrigger>
              <TabsTrigger value="league">League Percentile</TabsTrigger>
              <TabsTrigger value="overall">Overall Percentile</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading || !data
          ? Array.from({ length: 6 }).map((_, i) => <StatCardGroupSkeleton key={i} />)
          : data.cards.map((card) => (
              <Card key={card.type}>
                <CardHeader>
                  <CardTitle>{card.label}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {card.stats.map((stat) => {
                    const statIcon = STAT_ICONS[stat.key]
                    const description = glossary.get(stat.key)?.short_description
                    const display = statDisplay(stat, displayMode)
                    return (
                      <div key={stat.key} className="flex items-baseline justify-between gap-2">
                        <span className="flex items-center gap-1">
                          {stat.advanced && <AdvancedStatIndicator />}
                          {description ? (
                            <Tooltip>
                              <TooltipTrigger className="cursor-default text-left text-xs text-muted-foreground underline decoration-dotted underline-offset-2">
                                {stat.label}
                              </TooltipTrigger>
                              <TooltipContent>{description}</TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-muted-foreground text-xs">{stat.label}</span>
                          )}
                        </span>
                        <span className="flex items-center gap-1 text-sm font-medium tabular-nums">
                          {statIcon ? (
                            <statIcon.icon className={cn("size-3 shrink-0", statIcon.className)} />
                          ) : null}
                          {display.color ? (
                            <span
                              style={{ backgroundColor: display.color }}
                              className="rounded px-1.5 py-0.5 text-xs font-semibold text-neutral-900 tabular-nums"
                            >
                              {display.text}
                            </span>
                          ) : (
                            display.text
                          )}
                        </span>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            ))}
      </div>
    </div>
  )
}

function StatCardGroupSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-24" />
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </CardContent>
    </Card>
  )
}

import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"

import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { apiGet } from "@/lib/api"
import { getInitials, initialsTileStyle } from "@/lib/initials-color"
import type { PlayerDetail } from "@/types/football"

export const Route = createFileRoute("/players/$playerId")({
  component: PlayerDetailPage,
})

function PlayerDetailPage() {
  const { playerId } = Route.useParams()

  const { data, isLoading, isError } = useQuery({
    queryKey: ["football-player", playerId],
    queryFn: () => apiGet<PlayerDetail>(`/api/football/players/${playerId}`),
  })

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Player not found" description="This player doesn't exist in the current dataset." />
      </div>
    )
  }

  const profile = data?.profile

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
              {profile.name}
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
          profile && (
            <div className="flex gap-1">
              {profile.positions.map((pos) => (
                <Badge key={pos} variant="secondary">
                  {pos}
                </Badge>
              ))}
            </div>
          )
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
                  {card.stats.map((stat) => (
                    <div key={stat.key} className="flex items-baseline justify-between gap-2">
                      <span className="text-muted-foreground text-xs">{stat.label}</span>
                      <span className="text-sm font-medium tabular-nums">{stat.value}</span>
                    </div>
                  ))}
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

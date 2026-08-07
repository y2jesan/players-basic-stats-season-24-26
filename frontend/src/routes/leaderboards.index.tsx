import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { LeaderboardCard } from "@/components/leaderboard/leaderboard-card"
import { QualifiedToggle } from "@/components/leaderboard/qualified-toggle"
import { PageHeader } from "@/components/layout/page-header"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { useSeason } from "@/hooks/use-season"
import { apiGet } from "@/lib/api"
import { seasonParams } from "@/lib/football-query"
import { LEADERBOARD_CATEGORIES } from "@/lib/leaderboard-columns"
import { validateSeasonSearch } from "@/lib/season-search-params"
import type { Leaderboards } from "@/types/football"

export const Route = createFileRoute("/leaderboards/")({
  validateSearch: validateSeasonSearch,
  component: LeaderboardsIndexPage,
})

function LeaderboardsIndexPage() {
  useDocumentTitle("Leaderboards")
  const { season } = useSeason()
  const [qualified, setQualified] = useState(false)

  const { data: leaderboards, isLoading } = useQuery({
    queryKey: ["football-leaderboards", season, qualified],
    queryFn: () => apiGet<Leaderboards>(`/api/football/leaderboards?${seasonParams(season)}&qualified=${qualified}`),
    enabled: !!season,
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader title="Leaderboards" description="Top players across every stat category this season." />
        <QualifiedToggle checked={qualified} onCheckedChange={setQualified} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LEADERBOARD_CATEGORIES.map(({ category, title, columns }) => (
          <LeaderboardCard
            key={category}
            title={title}
            category={category}
            data={leaderboards?.[category]}
            isLoading={isLoading}
            columns={columns}
          />
        ))}
      </div>
    </div>
  )
}

import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { PageHeader } from "@/components/layout/page-header"
import { RoleScatterChart } from "@/components/stat/role-scatter-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { useSeason } from "@/hooks/use-season"
import { apiGet } from "@/lib/api"
import { scopeParams, seasonParams } from "@/lib/football-query"
import { validateSeasonSearch } from "@/lib/season-search-params"
import type { AnalysisCharts, Competition } from "@/types/football"

export const Route = createFileRoute("/analysis")({
  validateSearch: validateSeasonSearch,
  component: AnalysisPage,
})

const OVERALL = "overall"

const CHART_CARDS: { key: keyof AnalysisCharts; title: string; description: string }[] = [
  {
    key: "forwards",
    title: "Forwards — Finishing",
    description: "Top 25 forwards by goals. Above the trend shows over-performing shot quality.",
  },
  {
    key: "progressive_mids",
    title: "Progressive Midfielders — Ball Progression",
    description: "Top 25 midfielders by progressive passes, plotted against progressive carries.",
  },
  {
    key: "assisting_mids",
    title: "Assisting Midfielders — Creativity",
    description: "Top 25 midfielders by assists. Above the trend shows over-performing expected assists.",
  },
  {
    key: "passers",
    title: "Passers — Volume vs Accuracy",
    description: "Top 25 players by passes completed, plotted against pass completion %.",
  },
  {
    key: "defenders",
    title: "Defenders — Defensive Activity",
    description: "Top 25 defenders by tackles + interceptions combined, split by tackle vs. interception style.",
  },
  {
    key: "keepers",
    title: "Keepers — Shot Stopping",
    description: "Top 25 keepers by saves, plotted as save % against shot-stopping quality (PSxG +/-).",
  },
]

function AnalysisPage() {
  useDocumentTitle("Analysis")
  const { season } = useSeason()
  const [competition, setCompetition] = useState<string>(OVERALL)

  const { data: competitions } = useQuery({
    queryKey: ["football-competitions", season],
    queryFn: () => apiGet<Competition[]>(`/api/football/competitions?${seasonParams(season)}`),
    enabled: !!season,
  })

  const { data, isLoading } = useQuery({
    queryKey: ["football-analysis", season, competition],
    queryFn: () =>
      apiGet<AnalysisCharts>(
        `/api/football/analysis?${scopeParams(season, competition === OVERALL ? undefined : competition)}`
      ),
    enabled: !!season,
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Analysis"
        description="Top 25 players per role, plotted to separate volume from quality."
        actions={
          <Select
            value={competition}
            onValueChange={(value) => value && setCompetition(value)}
            items={[
              { value: OVERALL, label: "Overall" },
              ...(competitions?.map((c) => ({ value: c.competition_id, label: c.name })) ?? []),
            ]}
          >
            <SelectTrigger size="sm">
              <SelectValue placeholder="Competition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={OVERALL}>Overall</SelectItem>
              {competitions?.map((c) => (
                <SelectItem key={c.competition_id} value={c.competition_id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {CHART_CARDS.map(({ key, title, description }) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading || !data ? <Skeleton className="h-64 w-full" /> : <RoleScatterChart data={data[key]} />}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

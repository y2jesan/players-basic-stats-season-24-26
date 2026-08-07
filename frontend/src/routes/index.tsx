import type { ColumnDef } from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ChevronsRight, Globe, Goal, Handshake, ShieldHalf, Trophy, Users } from "lucide-react"
import { useMemo, useState } from "react"

import { StatCard, StatCardSkeleton } from "@/components/cards/stat-card"
import { DataTable } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { LeaderboardCard } from "@/components/leaderboard/leaderboard-card"
import { PageHeader } from "@/components/layout/page-header"
import { Section } from "@/components/layout/section"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { useSeason } from "@/hooks/use-season"
import { useStatGlossary } from "@/hooks/use-stat-glossary"
import { apiGet } from "@/lib/api"
import { scopeParams, seasonParams } from "@/lib/football-query"
import {
  DEFENDING_COLUMNS,
  DISCIPLINE_COLUMNS,
  KEEPING_COLUMNS,
  PASSING_COLUMNS,
  SHOOTING_COLUMNS,
} from "@/lib/leaderboard-columns"
import { validateSeasonSearch } from "@/lib/season-search-params"
import type { Competition, Country, DashboardSummary, Leaderboards, TeamSummary } from "@/types/football"

export const Route = createFileRoute("/")({
  validateSearch: validateSeasonSearch,
  component: DashboardPage,
})

const DEFAULT_COMPETITION = "premier-league"

function buildColumns(glossary: Map<string, { short_description: string }>): ColumnDef<TeamSummary, unknown>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Team" />,
      meta: { label: "Team" },
    },
    {
      accessorKey: "player_count",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Players" />,
      meta: { label: "Players" },
      size: 80,
    },
    {
      accessorKey: "total_goals",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Goals" description={glossary.get("Gls")?.short_description} />
      ),
      meta: { label: "Goals" },
      size: 80,
    },
    {
      accessorKey: "total_assists",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Assists" description={glossary.get("Ast")?.short_description} />
      ),
      meta: { label: "Assists" },
      size: 80,
    },
    {
      accessorKey: "avg_age",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Avg age" description={glossary.get("Age")?.short_description} />
      ),
      meta: { label: "Avg age" },
      size: 90,
    },
    {
      accessorKey: "total_yellow_cards",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Yellow" description={glossary.get("CrdY")?.short_description} />
      ),
      meta: { label: "Yellow cards" },
      size: 80,
    },
    {
      accessorKey: "total_red_cards",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Red" description={glossary.get("CrdR")?.short_description} />
      ),
      meta: { label: "Red cards" },
      size: 70,
    },
  ]
}

function buildCountryColumns(glossary: Map<string, { short_description: string }>): ColumnDef<Country, unknown>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Country" />,
      meta: { label: "Country" },
    },
    {
      accessorKey: "code",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Code" />,
      meta: { label: "Code" },
      size: 80,
    },
    {
      accessorKey: "player_count",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Players" />,
      meta: { label: "Players" },
      size: 80,
    },
    {
      accessorKey: "total_goals",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Goals" description={glossary.get("Gls")?.short_description} />
      ),
      meta: { label: "Goals" },
      size: 80,
    },
    {
      accessorKey: "total_assists",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Assists" description={glossary.get("Ast")?.short_description} />
      ),
      meta: { label: "Assists" },
      size: 80,
    },
    {
      accessorKey: "avg_age",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Avg age" description={glossary.get("Age")?.short_description} />
      ),
      meta: { label: "Avg age" },
      size: 90,
    },
    {
      accessorKey: "total_yellow_cards",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Yellow" description={glossary.get("CrdY")?.short_description} />
      ),
      meta: { label: "Yellow cards" },
      size: 80,
    },
    {
      accessorKey: "total_red_cards",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Red" description={glossary.get("CrdR")?.short_description} />
      ),
      meta: { label: "Red cards" },
      size: 70,
    },
  ]
}

function DashboardPage() {
  useDocumentTitle("Dashboard")
  const navigate = useNavigate()
  const { season } = useSeason()
  const [competition, setCompetition] = useState<string>(DEFAULT_COMPETITION)
  const { byProperty: glossary } = useStatGlossary()
  const columns = useMemo(() => buildColumns(glossary), [glossary])
  const countryColumns = useMemo(() => buildCountryColumns(glossary), [glossary])

  const { data: competitions } = useQuery({
    queryKey: ["football-competitions", season],
    queryFn: () => apiGet<Competition[]>(`/api/football/competitions?${seasonParams(season)}`),
    enabled: !!season,
  })

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["football-summary", season],
    queryFn: () => apiGet<DashboardSummary>(`/api/football/summary?${seasonParams(season)}`),
    enabled: !!season,
  })

  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ["football-teams", season, competition],
    queryFn: () => apiGet<TeamSummary[]>(`/api/football/teams?${scopeParams(season, competition)}`),
    enabled: !!season,
  })

  const { data: countries, isLoading: countriesLoading } = useQuery({
    queryKey: ["football-countries", season],
    queryFn: () => apiGet<Country[]>(`/api/football/countries?${seasonParams(season)}`),
    enabled: !!season,
  })

  const { data: leaderboards, isLoading: leaderboardsLoading } = useQuery({
    queryKey: ["football-leaderboards", season],
    queryFn: () => apiGet<Leaderboards>(`/api/football/leaderboards?${seasonParams(season)}`),
    enabled: !!season,
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Dashboard" description="Real season data across the top 5 European leagues." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {summaryLoading || !summary ? (
          Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              label="Competitions"
              value={summary.total_competitions}
              icon={Trophy}
              onClick={() => scrollToSection("teams-section")}
            />
            <StatCard
              label="Teams"
              value={summary.total_teams}
              icon={ShieldHalf}
              onClick={() => scrollToSection("teams-section")}
            />
            <StatCard
              label="Players"
              value={summary.total_players}
              icon={Users}
              onClick={() => scrollToSection("teams-section")}
            />
            <StatCard
              label="Countries"
              value={summary.total_countries}
              icon={Globe}
              onClick={() => scrollToSection("countries-section")}
            />
            <StatCard
              label="Total goals"
              value={summary.total_goals}
              icon={Goal}
              onClick={() => scrollToSection("teams-section")}
            />
            <StatCard
              label="Total assists"
              value={summary.total_assists}
              icon={Handshake}
              onClick={() => scrollToSection("teams-section")}
            />
          </>
        )}
      </div>

      <Section
        title="Player Leaderboards"
        description="Top players across all competitions this season."
        actions={
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link to="/leaderboards" search={{ season }} />}>
            See All
            <ChevronsRight className="size-4" />
          </Button>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <LeaderboardCard
            title="Shooting"
            category="shooting"
            data={leaderboards?.shooting}
            isLoading={leaderboardsLoading}
            columns={SHOOTING_COLUMNS}
          />
          <LeaderboardCard
            title="Passing"
            category="passing"
            data={leaderboards?.passing}
            isLoading={leaderboardsLoading}
            columns={PASSING_COLUMNS}
          />
          <LeaderboardCard
            title="Keeping"
            category="keeping"
            data={leaderboards?.keeping}
            isLoading={leaderboardsLoading}
            columns={KEEPING_COLUMNS}
          />
          <LeaderboardCard
            title="Defending"
            category="defending"
            data={leaderboards?.defending}
            isLoading={leaderboardsLoading}
            columns={DEFENDING_COLUMNS}
          />
          <LeaderboardCard
            title="Discipline"
            category="discipline"
            data={leaderboards?.discipline}
            isLoading={leaderboardsLoading}
            columns={DISCIPLINE_COLUMNS}
          />
        </div>
      </Section>

      <Section id="teams-section" title="Teams" description="Click a team to see its full roster.">
        <DataTable
          columns={columns}
          data={teams ?? []}
          mode="client"
          isLoading={teamsLoading}
          getRowId={(row) => row.team_id}
          tableId="dashboard-teams"
          onRowClick={(row) =>
            navigate({ to: "/teams/$teamId", params: { teamId: row.team_id }, search: { season } })
          }
          fitWidth
          hidePagination
          toolbar={{
            searchPlaceholder: "Search teams...",
            leading: (
              <div className="flex items-center gap-2">
                <Select value={competition} onValueChange={(value) => value && setCompetition(value)}>
                  <SelectTrigger size="sm">
                    <SelectValue placeholder="Competition" />
                  </SelectTrigger>
                  <SelectContent>
                    {competitions?.map((c) => (
                      <SelectItem key={c.competition_id} value={c.competition_id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ),
          }}
        />
      </Section>

      <Section id="countries-section" title="Countries" description="Click a country to see all its players.">
        <DataTable
          columns={countryColumns}
          data={countries ?? []}
          mode="client"
          isLoading={countriesLoading}
          getRowId={(row) => row.code}
          tableId="dashboard-countries"
          onRowClick={(row) =>
            navigate({ to: "/countries/$countryCode", params: { countryCode: row.code }, search: { season } })
          }
          fitWidth
          hidePagination
          toolbar={{ searchPlaceholder: "Search countries..." }}
        />
      </Section>
    </div>
  )
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
}

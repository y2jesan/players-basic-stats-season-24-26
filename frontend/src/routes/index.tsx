import type { ColumnDef } from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Globe, Goal, Handshake, ShieldHalf, Trophy, Users } from "lucide-react"
import { useEffect, useState } from "react"

import { StatCard, StatCardSkeleton } from "@/components/cards/stat-card"
import { DataTable } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { PageHeader } from "@/components/layout/page-header"
import { Section } from "@/components/layout/section"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiGet } from "@/lib/api"
import type { Competition, Country, DashboardSummary, Season, TeamSummary } from "@/types/football"

export const Route = createFileRoute("/")({
  component: DashboardPage,
})

const DEFAULT_COMPETITION = "premier-league"

const columns: ColumnDef<TeamSummary, unknown>[] = [
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Goals" />,
    meta: { label: "Goals" },
    size: 80,
  },
  {
    accessorKey: "total_assists",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Assists" />,
    meta: { label: "Assists" },
    size: 80,
  },
  {
    accessorKey: "avg_age",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Avg age" />,
    meta: { label: "Avg age" },
    size: 90,
  },
  {
    accessorKey: "total_yellow_cards",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Yellow" />,
    meta: { label: "Yellow cards" },
    size: 80,
  },
  {
    accessorKey: "total_red_cards",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Red" />,
    meta: { label: "Red cards" },
    size: 70,
  },
]

const countryColumns: ColumnDef<Country, unknown>[] = [
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
    size: 90,
  },
]

function DashboardPage() {
  const navigate = useNavigate()
  const [season, setSeason] = useState<string>("")
  const [competition, setCompetition] = useState<string>(DEFAULT_COMPETITION)

  const { data: seasons } = useQuery({
    queryKey: ["football-seasons"],
    queryFn: () => apiGet<Season[]>("/api/football/seasons"),
  })

  useEffect(() => {
    if (!season && seasons?.length) setSeason(seasons[0].id)
  }, [season, seasons])

  const { data: competitions } = useQuery({
    queryKey: ["football-competitions", season],
    queryFn: () => apiGet<Competition[]>(`/api/football/competitions?${seasonParams(season)}`),
    enabled: !!season,
  })

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["football-summary", season, competition],
    queryFn: () =>
      apiGet<DashboardSummary>(`/api/football/summary?${scopeParams(season, competition)}`),
    enabled: !!season,
  })

  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ["football-teams", season, competition],
    queryFn: () => apiGet<TeamSummary[]>(`/api/football/teams?${scopeParams(season, competition)}`),
    enabled: !!season,
  })

  const { data: countries, isLoading: countriesLoading } = useQuery({
    queryKey: ["football-countries", season, competition],
    queryFn: () => apiGet<Country[]>(`/api/football/countries?${scopeParams(season, competition)}`),
    enabled: !!season,
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Dashboard" description="Real 2025/26 season data across the top 5 European leagues." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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

      <Section id="teams-section" title="Teams" description="Click a team to see its full roster.">
        <DataTable
          columns={columns}
          data={teams ?? []}
          mode="client"
          isLoading={teamsLoading}
          getRowId={(row) => row.team_id}
          tableId="dashboard-teams"
          onRowClick={(row) => navigate({ to: "/teams/$teamId", params: { teamId: row.team_id } })}
          fitWidth
          hidePagination
          toolbar={{
            searchPlaceholder: "Search teams...",
            leading: (
              <div className="flex items-center gap-2">
                <Select value={season} onValueChange={(value) => setSeason(value ?? "")}>
                  <SelectTrigger size="sm">
                    <SelectValue placeholder="Season" />
                  </SelectTrigger>
                  <SelectContent>
                    {seasons?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
          onRowClick={(row) => navigate({ to: "/countries/$countryCode", params: { countryCode: row.code } })}
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

function seasonParams(season?: string) {
  const params = new URLSearchParams()
  if (season) params.set("season", season)
  return params
}

function scopeParams(season?: string, competition?: string) {
  const params = seasonParams(season)
  if (competition) params.set("competition", competition)
  return params
}

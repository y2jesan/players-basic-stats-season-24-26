import type { ColumnDef } from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { RankIcon } from "@/components/leaderboard/rank-icon"
import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { apiGet } from "@/lib/api"
import type { Leaderboards, LeaderboardCategory, LeaderboardPlayerBase } from "@/types/football"

export const Route = createFileRoute("/leaderboards/$category")({
  component: LeaderboardFullPage,
})

type AnyLeader = LeaderboardPlayerBase & Record<string, unknown>

type StatColumn = {
  key: string
  label: string
  render: (row: AnyLeader) => number | string
}

const CATEGORY_LABELS: Record<LeaderboardCategory, string> = {
  shooting: "Shooting",
  passing: "Passing",
  match: "Match",
  defending: "Defending",
  discipline: "Discipline",
}

const CATEGORY_STAT_COLUMNS: Record<LeaderboardCategory, StatColumn[]> = {
  shooting: [
    { key: "goals", label: "Goals", render: (r) => (r.goals as number) ?? 0 },
    { key: "goals_assists", label: "G+A", render: (r) => (r.goals_assists as number) ?? 0 },
    { key: "shots", label: "Shots", render: (r) => (r.shots as number) ?? 0 },
    { key: "shots_on_target", label: "SoT", render: (r) => (r.shots_on_target as number) ?? 0 },
    { key: "shots_on_target_pct", label: "SoT%", render: (r) => (r.shots_on_target_pct as number) ?? 0 },
  ],
  passing: [
    { key: "assists", label: "Assists", render: (r) => (r.assists as number) ?? 0 },
    { key: "crosses", label: "Crosses", render: (r) => (r.crosses as number) ?? 0 },
  ],
  match: [
    { key: "minutes", label: "Minutes", render: (r) => (r.minutes as number) ?? 0 },
    { key: "matches_played", label: "Matches", render: (r) => (r.matches_played as number) ?? 0 },
    { key: "starts", label: "Starts", render: (r) => (r.starts as number) ?? 0 },
    { key: "nineties", label: "90s", render: (r) => (r.nineties as number) ?? 0 },
  ],
  defending: [
    { key: "tackles_won", label: "Tackles Won", render: (r) => (r.tackles_won as number) ?? 0 },
    { key: "interceptions", label: "Interceptions", render: (r) => (r.interceptions as number) ?? 0 },
    { key: "clean_sheets", label: "Clean Sheets", render: (r) => (r.clean_sheets as number) ?? 0 },
    { key: "clean_sheet_pct", label: "CS%", render: (r) => (r.clean_sheet_pct as number) ?? 0 },
  ],
  discipline: [
    { key: "fouls_committed", label: "Fouls", render: (r) => (r.fouls_committed as number) ?? 0 },
    { key: "fouls_drawn", label: "Fouls Drawn", render: (r) => (r.fouls_drawn as number) ?? 0 },
    { key: "yellow_cards", label: "Yellow", render: (r) => (r.yellow_cards as number) ?? 0 },
    { key: "red_cards", label: "Red", render: (r) => (r.red_cards as number) ?? 0 },
    { key: "second_yellow_cards", label: "2nd Yellow", render: (r) => (r.second_yellow_cards as number) ?? 0 },
  ],
}

function buildColumns(statColumns: StatColumn[]): ColumnDef<AnyLeader, unknown>[] {
  return [
    {
      accessorKey: "rank",
      header: ({ column }) => <DataTableColumnHeader column={column} title="#" />,
      meta: { label: "Rank" },
      cell: ({ row }) => <RankIcon rank={row.original.rank as number} />,
      size: 50,
    },
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Player" />,
      meta: { label: "Player" },
    },
    {
      id: "positions",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Position" />,
      meta: { label: "Position" },
      accessorFn: (row) => (row.positions as string[]).join(","),
      cell: ({ row }) => (
        <div className="flex gap-1">
          {(row.original.positions as string[]).map((pos) => (
            <Badge key={pos} variant="secondary">
              {pos}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      accessorKey: "team_name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Team" />,
      meta: { label: "Team" },
    },
    ...statColumns.map(
      (col): ColumnDef<AnyLeader, unknown> => ({
        accessorKey: col.key,
        header: ({ column }) => <DataTableColumnHeader column={column} title={col.label} />,
        meta: { label: col.label },
        cell: ({ row }) => col.render(row.original),
        size: 90,
      })
    ),
  ]
}

function LeaderboardFullPage() {
  const { category } = Route.useParams()
  const navigate = useNavigate()
  const isValidCategory = category in CATEGORY_LABELS
  const typedCategory = category as LeaderboardCategory

  const { data, isLoading, isError } = useQuery({
    queryKey: ["football-leaderboards-full"],
    queryFn: () => apiGet<Leaderboards>("/api/football/leaderboards"),
    enabled: isValidCategory,
  })

  if (!isValidCategory || isError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Leaderboard not found" description="Unknown leaderboard category." />
      </div>
    )
  }

  const leaders = (data?.[typedCategory] as AnyLeader[] | undefined) ?? []
  const rows: AnyLeader[] = leaders.map((row, i) => ({ ...row, rank: i + 1 }))
  const columns = buildColumns(CATEGORY_STAT_COLUMNS[typedCategory])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${CATEGORY_LABELS[typedCategory]} Leaderboard`}
        description={`Top ${rows.length || ""} players across all competitions this season.`}
      />

      <DataTable
        columns={columns}
        data={rows}
        mode="client"
        isLoading={isLoading}
        getRowId={(row) => row.player_id as string}
        tableId={`leaderboard-${typedCategory}`}
        onRowClick={(row) => navigate({ to: "/players/$playerId", params: { playerId: row.player_id as string } })}
        fitWidth
        hidePagination
        toolbar={{ searchPlaceholder: "Search players..." }}
      />
    </div>
  )
}

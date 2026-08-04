import type { ColumnDef } from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useMemo } from "react"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { RankIcon } from "@/components/leaderboard/rank-icon"
import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { useStatGlossary } from "@/hooks/use-stat-glossary"
import { ADVANCED_STAT_KEYS } from "@/lib/advanced-stats"
import { apiGet } from "@/lib/api"
import { seasonParams } from "@/lib/football-query"
import { validateSeasonSearch } from "@/lib/season-search-params"
import type { Leaderboards, LeaderboardCategory, LeaderboardPlayerBase } from "@/types/football"

export const Route = createFileRoute("/leaderboards/$category")({
  validateSearch: validateSeasonSearch,
  component: LeaderboardFullPage,
})

type AnyLeader = LeaderboardPlayerBase & Record<string, unknown>

type StatColumn = {
  key: string
  label: string
  statProperty: string
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
    { key: "goals", label: "Goals", statProperty: "Gls", render: (r) => (r.goals as number) ?? 0 },
    { key: "goals_assists", label: "G+A", statProperty: "G+A", render: (r) => (r.goals_assists as number) ?? 0 },
    { key: "shots", label: "Shots", statProperty: "Sh", render: (r) => (r.shots as number) ?? "-" },
    { key: "shots_on_target", label: "SoT", statProperty: "SoT", render: (r) => (r.shots_on_target as number) ?? "-" },
    {
      key: "shots_on_target_pct",
      label: "SoT%",
      statProperty: "SoT%",
      render: (r) => (r.shots_on_target_pct as number) ?? "-",
    },
    { key: "xg", label: "xG", statProperty: "xG", render: (r) => (r.xg as number) ?? "-" },
    { key: "npxg", label: "npxG", statProperty: "npxG", render: (r) => (r.npxg as number) ?? "-" },
    { key: "xag", label: "xAG", statProperty: "xAG", render: (r) => (r.xag as number) ?? "-" },
  ],
  passing: [
    { key: "assists", label: "Assists", statProperty: "Ast", render: (r) => (r.assists as number) ?? 0 },
    { key: "crosses", label: "Crosses", statProperty: "Crs", render: (r) => (r.crosses as number) ?? "-" },
    { key: "cmp_pct", label: "Cmp%", statProperty: "Cmp%", render: (r) => (r.cmp_pct as number) ?? "-" },
    { key: "key_passes", label: "KP", statProperty: "KP", render: (r) => (r.key_passes as number) ?? "-" },
    { key: "xa", label: "xA", statProperty: "xA", render: (r) => (r.xa as number) ?? "-" },
  ],
  match: [
    { key: "minutes", label: "Minutes", statProperty: "Min", render: (r) => (r.minutes as number) ?? 0 },
    { key: "matches_played", label: "Matches", statProperty: "MP", render: (r) => (r.matches_played as number) ?? 0 },
    { key: "starts", label: "Starts", statProperty: "Starts", render: (r) => (r.starts as number) ?? 0 },
    { key: "nineties", label: "90s", statProperty: "90s", render: (r) => (r.nineties as number) ?? 0 },
  ],
  defending: [
    { key: "tackles_won", label: "Tackles Won", statProperty: "TklW", render: (r) => (r.tackles_won as number) ?? 0 },
    { key: "interceptions", label: "Interceptions", statProperty: "Int", render: (r) => (r.interceptions as number) ?? 0 },
    { key: "clean_sheets", label: "Clean Sheets", statProperty: "CS", render: (r) => (r.clean_sheets as number) ?? "-" },
    { key: "clean_sheet_pct", label: "CS%", statProperty: "CS%", render: (r) => (r.clean_sheet_pct as number) ?? "-" },
    { key: "tkl_pct", label: "Tkl%", statProperty: "Tkl%", render: (r) => (r.tkl_pct as number) ?? "-" },
    { key: "clearances", label: "Clr", statProperty: "Clr", render: (r) => (r.clearances as number) ?? "-" },
  ],
  discipline: [
    { key: "fouls_committed", label: "Fouls", statProperty: "Fls", render: (r) => (r.fouls_committed as number) ?? 0 },
    { key: "fouls_drawn", label: "Fouls Drawn", statProperty: "Fld", render: (r) => (r.fouls_drawn as number) ?? 0 },
    { key: "yellow_cards", label: "Yellow", statProperty: "CrdY", render: (r) => (r.yellow_cards as number) ?? 0 },
    { key: "red_cards", label: "Red", statProperty: "CrdR", render: (r) => (r.red_cards as number) ?? 0 },
    {
      key: "second_yellow_cards",
      label: "2nd Yellow",
      statProperty: "2CrdY",
      render: (r) => (r.second_yellow_cards as number) ?? 0,
    },
  ],
}

function buildColumns(
  statColumns: StatColumn[],
  glossary: Map<string, { short_description: string }>,
  season: string | undefined
): ColumnDef<AnyLeader, unknown>[] {
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
      cell: ({ row }) => (
        <Link
          to="/players/$playerId"
          params={{ playerId: row.original.player_id as string }}
          search={{ season }}
          className="hover:text-foreground underline underline-offset-2"
        >
          {row.original.name as string}
        </Link>
      ),
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
      cell: ({ row }) => (
        <Link
          to="/teams/$teamId"
          params={{ teamId: row.original.team_id as string }}
          search={{ season }}
          className="hover:text-foreground underline underline-offset-2"
        >
          {row.original.team_name as string}
        </Link>
      ),
    },
    {
      id: "league",
      header: ({ column }) => <DataTableColumnHeader column={column} title="League" />,
      meta: { label: "League" },
      accessorFn: (row) => (row.competition as { name: string } | null)?.name ?? "",
    },
    ...statColumns.map(
      (col): ColumnDef<AnyLeader, unknown> => ({
        accessorKey: col.key,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={col.label}
            description={glossary.get(col.statProperty)?.short_description}
            advanced={ADVANCED_STAT_KEYS.has(col.statProperty)}
          />
        ),
        meta: { label: col.label },
        cell: ({ row }) => col.render(row.original),
        size: 90,
      })
    ),
  ]
}

function LeaderboardFullPage() {
  const { category } = Route.useParams()
  const { season } = Route.useSearch()
  const { byProperty: glossary } = useStatGlossary()
  const isValidCategory = category in CATEGORY_LABELS
  const typedCategory = category as LeaderboardCategory

  const { data, isLoading, isError } = useQuery({
    queryKey: ["football-leaderboards-full", season],
    queryFn: () => apiGet<Leaderboards>(`/api/football/leaderboards?${seasonParams(season)}`),
    enabled: isValidCategory,
  })

  const columns = useMemo(
    () => (isValidCategory ? buildColumns(CATEGORY_STAT_COLUMNS[typedCategory], glossary, season) : []),
    [isValidCategory, typedCategory, glossary, season]
  )

  if (!isValidCategory || isError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Leaderboard not found" description="Unknown leaderboard category." />
      </div>
    )
  }

  const leaders = (data?.[typedCategory] as AnyLeader[] | undefined) ?? []
  const rows: AnyLeader[] = leaders.map((row, i) => ({ ...row, rank: i + 1 }))

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
        defaultColumnVisibility={{ league: false }}
        fitWidth
        hidePagination
        toolbar={{ searchPlaceholder: "Search players..." }}
      />
    </div>
  )
}

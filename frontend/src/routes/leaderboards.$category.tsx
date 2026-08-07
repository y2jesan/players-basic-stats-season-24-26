import type { ColumnDef } from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useMemo, useState } from "react"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { RankIcon } from "@/components/leaderboard/rank-icon"
import { QualifiedToggle } from "@/components/leaderboard/qualified-toggle"
import { PageHeader } from "@/components/layout/page-header"
import { PositionBadge } from "@/components/player/position-badge"
import { PerNinetyToggle } from "@/components/stat/per-90-toggle"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { useSeason } from "@/hooks/use-season"
import { useStatGlossary } from "@/hooks/use-stat-glossary"
import { ADVANCED_STAT_KEYS } from "@/lib/advanced-stats"
import { apiGet } from "@/lib/api"
import { seasonParams } from "@/lib/football-query"
import { isRateStat, toPer90 } from "@/lib/per-90"
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
  defending: "Defending",
  discipline: "Discipline",
  keeping: "Keeping",
  progression: "Progression",
  pass_accuracy: "Pass Accuracy",
  possession: "Possession",
  creativity: "Creativity",
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
  keeping: [
    { key: "saves", label: "Saves", statProperty: "Saves", render: (r) => (r.saves as number) ?? 0 },
    { key: "save_pct", label: "Save%", statProperty: "Save%", render: (r) => (r.save_pct as number) ?? "-" },
    { key: "clean_sheets", label: "Clean Sheets", statProperty: "CS", render: (r) => (r.clean_sheets as number) ?? "-" },
    { key: "clean_sheet_pct", label: "CS%", statProperty: "CS%", render: (r) => (r.clean_sheet_pct as number) ?? "-" },
    { key: "psxg_diff", label: "PSxG+/-", statProperty: "PSxG+/-", render: (r) => (r.psxg_diff as number) ?? "-" },
    { key: "ga90", label: "GA90", statProperty: "GA90", render: (r) => (r.ga90 as number) ?? "-" },
  ],
  progression: [
    { key: "prog_passes", label: "PrgP", statProperty: "PrgP", render: (r) => (r.prog_passes as number) ?? 0 },
    { key: "prog_carries", label: "PrgC", statProperty: "PrgC", render: (r) => (r.prog_carries as number) ?? 0 },
    { key: "prog_received", label: "PrgR", statProperty: "PrgR", render: (r) => (r.prog_received as number) ?? 0 },
    {
      key: "prog_distance",
      label: "Prog. Distance",
      statProperty: "PrgDist",
      render: (r) => (r.prog_distance as number) ?? "-",
    },
  ],
  pass_accuracy: [
    { key: "cmp_pct", label: "Cmp%", statProperty: "Cmp%", render: (r) => (r.cmp_pct as number) ?? "-" },
    { key: "passes_completed", label: "Cmp", statProperty: "Cmp", render: (r) => (r.passes_completed as number) ?? 0 },
    { key: "passes_attempted", label: "Att", statProperty: "Att", render: (r) => (r.passes_attempted as number) ?? 0 },
    { key: "key_passes", label: "KP", statProperty: "KP", render: (r) => (r.key_passes as number) ?? "-" },
  ],
  possession: [
    { key: "touches", label: "Touches", statProperty: "Touches", render: (r) => (r.touches as number) ?? 0 },
    { key: "carries", label: "Carries", statProperty: "Carries", render: (r) => (r.carries as number) ?? 0 },
    { key: "take_ons", label: "Take-Ons", statProperty: "Succ", render: (r) => (r.take_ons as number) ?? "-" },
    { key: "take_on_pct", label: "Succ%", statProperty: "Succ%", render: (r) => (r.take_on_pct as number) ?? "-" },
  ],
  creativity: [
    { key: "sca", label: "SCA", statProperty: "SCA", render: (r) => (r.sca as number) ?? 0 },
    { key: "sca90", label: "SCA/90", statProperty: "SCA90", render: (r) => (r.sca90 as number) ?? "-" },
    { key: "gca", label: "GCA", statProperty: "GCA", render: (r) => (r.gca as number) ?? 0 },
    { key: "gca90", label: "GCA/90", statProperty: "GCA90", render: (r) => (r.gca90 as number) ?? "-" },
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
        <div className="flex flex-col">
          <Link
            to="/players/$playerId"
            params={{ playerId: row.original.player_id as string }}
            search={{ season }}
            className="hover:text-primary w-fit underline underline-offset-2"
          >
            {row.original.name as string}
          </Link>
          <Link
            to="/teams/$teamId"
            params={{ teamId: row.original.team_id as string }}
            search={{ season }}
            className="text-muted-foreground hover:text-primary w-fit text-xs underline underline-offset-2"
          >
            {row.original.team_name as string}
          </Link>
        </div>
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
            <PositionBadge key={pos} position={pos} />
          ))}
        </div>
      ),
    },
    {
      accessorKey: "matches_played",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Matches" />,
      meta: { label: "Matches" },
      size: 80,
    },
    {
      accessorKey: "minutes",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Minutes" />,
      meta: { label: "Minutes" },
      size: 80,
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
  const { season } = useSeason()
  const { byProperty: glossary } = useStatGlossary()
  const [perNinety, setPerNinety] = useState(false)
  const [qualified, setQualified] = useState(false)
  const isValidCategory = category in CATEGORY_LABELS
  const typedCategory = category as LeaderboardCategory

  const { data, isLoading, isError } = useQuery({
    queryKey: ["football-leaderboards-full", season, qualified],
    queryFn: () => apiGet<Leaderboards>(`/api/football/leaderboards?${seasonParams(season)}&qualified=${qualified}`),
    enabled: isValidCategory,
  })

  const columns = useMemo(
    () => (isValidCategory ? buildColumns(CATEGORY_STAT_COLUMNS[typedCategory], glossary, season) : []),
    [isValidCategory, typedCategory, glossary, season]
  )

  // Per-90 division happens on the row data itself (not just in the cell renderer) so that
  // column sorting — which reads straight from each row's accessorKey value — sorts by
  // whichever values are currently on screen, not the always-raw totals underneath.
  const rows: AnyLeader[] = useMemo(() => {
    const leaders = (data?.[typedCategory] as AnyLeader[] | undefined) ?? []
    const statColumns = isValidCategory ? CATEGORY_STAT_COLUMNS[typedCategory] : []
    return leaders.map((row, i) => {
      const ranked: AnyLeader = { ...row, rank: i + 1 }
      if (!perNinety) return ranked
      for (const col of statColumns) {
        if (isRateStat(col.statProperty)) continue
        const value = col.render(ranked)
        if (typeof value === "number") {
          ranked[col.key] = toPer90(value, ranked.minutes) ?? "-"
        }
      }
      return ranked
    })
  }, [data, typedCategory, isValidCategory, perNinety])

  useDocumentTitle(isValidCategory && !isError ? `${CATEGORY_LABELS[typedCategory]} Leaderboard` : "Leaderboard not found")

  if (!isValidCategory || isError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Leaderboard not found" description="Unknown leaderboard category." />
      </div>
    )
  }

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
        fitWidth
        hidePagination
        toolbar={{
          searchPlaceholder: "Search players...",
          trailing: (
            <div className="flex items-center gap-3">
              <QualifiedToggle checked={qualified} onCheckedChange={setQualified} />
              <PerNinetyToggle checked={perNinety} onCheckedChange={setPerNinety} />
            </div>
          ),
        }}
      />
    </div>
  )
}

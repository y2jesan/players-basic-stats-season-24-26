import type { ColumnDef } from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Goal, ImageOff, ShieldHalf, Target, Users } from "lucide-react"
import { useState } from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { StatCard, StatCardSkeleton } from "@/components/cards/stat-card"
import { DataTable } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { PageHeader } from "@/components/layout/page-header"
import { Section } from "@/components/layout/section"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { parseSortParam, serializeSortParam, validateTableSearch } from "@/lib/table-search-params"

export const Route = createFileRoute("/analysis")({
  validateSearch: validateTableSearch,
  component: AnalysisPage,
})

type BackendPlayer = {
  player_id: string
  team_name: string
  name: string
  shirt_number: number
  age: number
  position: string
  nationality: string
  appearances: number
  minutes_played: number
  goals: number
  assists: number
  xg: number
  yellow_cards: number
  red_cards: number
}

type PlayersPageResponse = {
  rows: BackendPlayer[]
  total: number
  page: number
  page_size: number
}

type Summary = {
  total_teams: number
  total_players: number
  total_matches: number
  total_goals: number
  avg_goals_per_match: number
  top_scorer: { player_id: string; name: string; team_name: string; goals: number }
}

type TimelinePoint = { month: string; goals: number; matches: number }

const FEATURED_MATCH_ID = "match-1"

const columns: ColumnDef<BackendPlayer, unknown>[] = [
  {
    accessorKey: "shirt_number",
    header: ({ column }) => <DataTableColumnHeader column={column} title="#" />,
    meta: { label: "Shirt number" },
    size: 48,
  },
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    meta: { label: "Name" },
  },
  {
    accessorKey: "position",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Position" />,
    meta: { label: "Position" },
    cell: ({ row }) => <Badge variant="secondary">{row.original.position}</Badge>,
  },
  {
    accessorKey: "team_name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Team" />,
    meta: { label: "Team" },
  },
  {
    accessorKey: "nationality",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nationality" />,
    meta: { label: "Nationality" },
  },
  {
    accessorKey: "age",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Age" />,
    meta: { label: "Age" },
    size: 60,
  },
  {
    accessorKey: "appearances",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Apps" />,
    meta: { label: "Appearances" },
    size: 70,
  },
  {
    accessorKey: "minutes_played",
    header: "Minutes",
    meta: { label: "Minutes played" },
    enableSorting: false,
  },
  {
    accessorKey: "goals",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Goals" />,
    meta: { label: "Goals" },
    size: 70,
  },
  {
    accessorKey: "assists",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Assists" />,
    meta: { label: "Assists" },
    size: 70,
  },
  {
    accessorKey: "xg",
    header: ({ column }) => <DataTableColumnHeader column={column} title="xG" />,
    meta: { label: "xG" },
    cell: ({ row }) => row.original.xg.toFixed(1),
    size: 60,
  },
]

const timelineConfig = {
  goals: { label: "Goals", color: "var(--chart-2)" },
} satisfies ChartConfig

// Temporarily hidden while the dashboard/team/player pages take over as the primary views.
// Flip back to true to restore the fake-data summary/chart/plots/table below.
const SHOW_CONTENT = false

function AnalysisPage() {
  useDocumentTitle("Analysis")
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const sorting = parseSortParam(search.sort)
  const globalFilter = search.q ?? ""
  const pagination = { pageIndex: (search.page ?? 1) - 1, pageSize: search.size ?? 10 }
  const primarySort = sorting[0]

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["stats-summary"],
    queryFn: async () => {
      const res = await fetch("/api/stats/summary")
      if (!res.ok) throw new Error("Failed to load summary")
      return (await res.json()) as Summary
    },
    enabled: SHOW_CONTENT,
  })

  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ["stats-timeline"],
    queryFn: async () => {
      const res = await fetch("/api/stats/timeline")
      if (!res.ok) throw new Error("Failed to load timeline")
      return (await res.json()) as TimelinePoint[]
    },
    enabled: SHOW_CONTENT,
  })

  const { data: playersPage, isLoading: playersLoading } = useQuery({
    queryKey: ["players", pagination.pageIndex, pagination.pageSize, primarySort, globalFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(pagination.pageIndex + 1),
        page_size: String(pagination.pageSize),
      })
      if (primarySort) {
        params.set("sort", primarySort.id)
        params.set("order", primarySort.desc ? "desc" : "asc")
      }
      if (globalFilter) params.set("q", globalFilter)

      const res = await fetch(`/api/players?${params}`)
      if (!res.ok) throw new Error("Failed to load players")
      return (await res.json()) as PlayersPageResponse
    },
    enabled: SHOW_CONTENT,
  })

  const heatmapPlayerId = summary?.top_scorer.player_id

  if (!SHOW_CONTENT) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Analysis" description="Temporarily hidden." />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Analysis" description="Live data and plots served by the FastAPI backend." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryLoading || !summary ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard label="Teams" value={summary.total_teams} icon={ShieldHalf} />
            <StatCard label="Players" value={summary.total_players} icon={Users} />
            <StatCard label="Goals this season" value={summary.total_goals} icon={Goal} />
            <StatCard label="Avg goals / match" value={summary.avg_goals_per_match} icon={Target} />
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Goals per month</CardTitle>
        </CardHeader>
        <CardContent>
          {timelineLoading || !timeline ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ChartContainer config={timelineConfig} className="h-64 w-full">
              <AreaChart data={timeline}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  dataKey="goals"
                  type="monotone"
                  fill="var(--color-goals)"
                  fillOpacity={0.2}
                  stroke="var(--color-goals)"
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Shot map — {FEATURED_MATCH_ID}</CardTitle>
          </CardHeader>
          <CardContent>
            <PlotImage src={`/api/plots/shot-map?match_id=${FEATURED_MATCH_ID}`} alt="Match shot map" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Touch map — {summary?.top_scorer.name ?? "top scorer"}</CardTitle>
          </CardHeader>
          <CardContent>
            {heatmapPlayerId ? (
              <PlotImage src={`/api/plots/heatmap?player_id=${heatmapPlayerId}`} alt="Player touch map" />
            ) : (
              <Skeleton className="aspect-10/7 w-full" />
            )}
          </CardContent>
        </Card>
      </div>

      <Section title="Players" description="Server-side pagination, sorting, and search against /api/players.">
        <DataTable
          columns={columns}
          data={playersPage?.rows ?? []}
          mode="server"
          isLoading={playersLoading}
          pageCount={playersPage ? Math.ceil(playersPage.total / pagination.pageSize) : 0}
          rowCount={playersPage?.total ?? 0}
          getRowId={(row) => row.player_id}
          tableId="analysis-players"
          sorting={sorting}
          onSortingChange={(updater) => {
            const next = typeof updater === "function" ? updater(sorting) : updater
            navigate({ search: (prev) => ({ ...prev, sort: serializeSortParam(next) }), replace: true })
          }}
          globalFilter={globalFilter}
          onGlobalFilterChange={(value) =>
            navigate({ search: (prev) => ({ ...prev, q: value || undefined, page: undefined }), replace: true })
          }
          pagination={pagination}
          onPaginationChange={(updater) => {
            const next = typeof updater === "function" ? updater(pagination) : updater
            navigate({
              search: (prev) => ({ ...prev, page: next.pageIndex + 1, size: next.pageSize }),
              replace: true,
            })
          }}
          toolbar={{ searchPlaceholder: "Search players..." }}
        />
      </Section>
    </div>
  )
}

function PlotImage({ src, alt }: { src: string; alt: string }) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading")

  return (
    <div className="bg-muted relative aspect-10/7 w-full overflow-hidden rounded-md">
      {status === "loading" && <Skeleton className="absolute inset-0" />}
      {status === "error" && (
        <div className="text-muted-foreground absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm">
          <ImageOff className="size-6" />
          Failed to load plot
        </div>
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="size-full object-contain"
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
        style={{ visibility: status === "loaded" ? "visible" : "hidden" }}
      />
    </div>
  )
}

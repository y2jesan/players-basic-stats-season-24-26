import type { ColumnDef } from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useMemo } from "react"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { useStatGlossary } from "@/hooks/use-stat-glossary"
import { apiGet } from "@/lib/api"
import type { TeamDetail, TeamRosterPlayer } from "@/types/football"

export const Route = createFileRoute("/teams/$teamId")({
  component: TeamDetailPage,
})

function buildColumns(glossary: Map<string, { short_description: string }>): ColumnDef<TeamRosterPlayer, unknown>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      meta: { label: "Name" },
    },
    {
      id: "positions",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Position" />,
      meta: { label: "Position" },
      accessorFn: (row) => row.positions.join(","),
      cell: ({ row }) => (
        <div className="flex gap-1">
          {row.original.positions.map((pos) => (
            <Badge key={pos} variant="secondary">
              {pos}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      id: "nationality",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nationality" />,
      meta: { label: "Nationality" },
      accessorFn: (row) => row.nationality?.name ?? "",
    },
    {
      accessorKey: "age",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Age" description={glossary.get("Age")?.short_description} />
      ),
      meta: { label: "Age" },
      size: 60,
    },
    {
      accessorKey: "appearances",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Apps" description={glossary.get("MP")?.short_description} />
      ),
      meta: { label: "Appearances" },
      size: 70,
    },
    {
      accessorKey: "goals",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Goals" description={glossary.get("Gls")?.short_description} />
      ),
      meta: { label: "Goals" },
      size: 70,
    },
    {
      accessorKey: "assists",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Assists" description={glossary.get("Ast")?.short_description} />
      ),
      meta: { label: "Assists" },
      size: 70,
    },
    {
      accessorKey: "yellow_cards",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Yellow" description={glossary.get("CrdY")?.short_description} />
      ),
      meta: { label: "Yellow cards" },
      size: 70,
    },
    {
      accessorKey: "red_cards",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Red" description={glossary.get("CrdR")?.short_description} />
      ),
      meta: { label: "Red cards" },
      size: 60,
    },
  ]
}

function TeamDetailPage() {
  const { teamId } = Route.useParams()
  const navigate = useNavigate()
  const { byProperty: glossary } = useStatGlossary()
  const columns = useMemo(() => buildColumns(glossary), [glossary])

  const { data, isLoading, isError } = useQuery({
    queryKey: ["football-team", teamId],
    queryFn: () => apiGet<TeamDetail>(`/api/football/teams/${teamId}`),
  })

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Team not found" description="This team doesn't exist in the current dataset." />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={data?.team.name ?? "Loading..."}
        description={
          data
            ? `${data.team.competition?.name ?? "Unknown competition"} · ${data.team.player_count} players`
            : undefined
        }
      />

      <DataTable
        columns={columns}
        data={data?.players ?? []}
        mode="client"
        isLoading={isLoading}
        getRowId={(row) => row.player_id}
        tableId="team-players"
        onRowClick={(row) => navigate({ to: "/players/$playerId", params: { playerId: row.player_id } })}
        fitWidth
        hidePagination
        toolbar={{ searchPlaceholder: "Search players..." }}
      />
    </div>
  )
}

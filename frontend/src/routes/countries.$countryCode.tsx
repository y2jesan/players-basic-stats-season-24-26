import type { ColumnDef } from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { apiGet } from "@/lib/api"
import type { CountryDetail, CountryRosterPlayer } from "@/types/football"

export const Route = createFileRoute("/countries/$countryCode")({
  component: CountryDetailPage,
})

const columns: ColumnDef<CountryRosterPlayer, unknown>[] = [
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
    accessorKey: "team_name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Team" />,
    meta: { label: "Team" },
  },
  {
    id: "competition",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Competition" />,
    meta: { label: "Competition" },
    accessorFn: (row) => row.competition?.name ?? "",
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
    accessorKey: "yellow_cards",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Yellow" />,
    meta: { label: "Yellow cards" },
    size: 70,
  },
  {
    accessorKey: "red_cards",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Red" />,
    meta: { label: "Red cards" },
    size: 60,
  },
]

function CountryDetailPage() {
  const { countryCode } = Route.useParams()
  const navigate = useNavigate()

  const { data, isLoading, isError } = useQuery({
    queryKey: ["football-country", countryCode],
    queryFn: () => apiGet<CountryDetail>(`/api/football/countries/${countryCode}`),
  })

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Country not found" description="This country doesn't exist in the current dataset." />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={data?.country.name ?? "Loading..."}
        description={data ? `${data.country.player_count} players across the top 5 leagues` : undefined}
      />

      <DataTable
        columns={columns}
        data={data?.players ?? []}
        mode="client"
        isLoading={isLoading}
        getRowId={(row) => row.player_id}
        tableId="country-players"
        onRowClick={(row) => navigate({ to: "/players/$playerId", params: { playerId: row.player_id } })}
        fitWidth
        hidePagination
        toolbar={{ searchPlaceholder: "Search players..." }}
      />
    </div>
  )
}

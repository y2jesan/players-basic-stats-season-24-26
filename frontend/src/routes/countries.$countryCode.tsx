import type { ColumnDef } from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useMemo } from "react"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { PageHeader } from "@/components/layout/page-header"
import { PositionBadge } from "@/components/player/position-badge"
import { Badge } from "@/components/ui/badge"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { useSeason } from "@/hooks/use-season"
import { useStatGlossary } from "@/hooks/use-stat-glossary"
import { apiGet } from "@/lib/api"
import { formatSeasonLabel, seasonParams } from "@/lib/football-query"
import { validateSeasonSearch } from "@/lib/season-search-params"
import type { CountryDetail, CountryRosterPlayer } from "@/types/football"

export const Route = createFileRoute("/countries/$countryCode")({
  validateSearch: validateSeasonSearch,
  component: CountryDetailPage,
})

function buildColumns(
  glossary: Map<string, { short_description: string }>
): ColumnDef<CountryRosterPlayer, unknown>[] {
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
            <PositionBadge key={pos} position={pos} />
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

function CountryDetailPage() {
  const { countryCode } = Route.useParams()
  const { season } = useSeason()
  const navigate = useNavigate()
  const { byProperty: glossary } = useStatGlossary()
  const columns = useMemo(() => buildColumns(glossary), [glossary])

  const { data, isLoading, isError } = useQuery({
    queryKey: ["football-country", countryCode, season],
    queryFn: () => apiGet<CountryDetail>(`/api/football/countries/${countryCode}?${seasonParams(season)}`),
  })

  useDocumentTitle(isError ? "Country not found" : data?.country.name)

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
        actions={data && <Badge variant="outline">{formatSeasonLabel(data.country.season)}</Badge>}
      />

      <DataTable
        columns={columns}
        data={data?.players ?? []}
        mode="client"
        isLoading={isLoading}
        getRowId={(row) => row.player_id}
        tableId="country-players"
        onRowClick={(row) =>
          navigate({ to: "/players/$playerId", params: { playerId: row.player_id }, search: { season } })
        }
        fitWidth
        hidePagination
        toolbar={{ searchPlaceholder: "Search players..." }}
      />
    </div>
  )
}

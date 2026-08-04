import type { Table } from "@tanstack/react-table"
import type { LucideIcon } from "lucide-react"
import { Check, Download, Rows3, X } from "lucide-react"
import type { ReactNode } from "react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { DataTableFacetedFilter } from "@/components/data-table/data-table-faceted-filter"
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options"
import type { Density } from "@/components/data-table/data-table"

export type FacetedFilterConfig = {
  columnId: string
  title: string
  options: { label: string; value: string; icon?: LucideIcon }[]
}

export function DataTableToolbar<TData>({
  table,
  globalFilter,
  onGlobalFilterChange,
  searchPlaceholder = "Search...",
  leading,
  facetedFilters = [],
  trailing,
  density,
  onDensityChange,
  onExport,
  selectedCount,
  bulkActions,
  onClearSelection,
}: {
  table: Table<TData>
  globalFilter: string
  onGlobalFilterChange: (value: string) => void
  searchPlaceholder?: string
  leading?: ReactNode
  facetedFilters?: FacetedFilterConfig[]
  trailing?: ReactNode
  density: Density
  onDensityChange: (density: Density) => void
  onExport?: (scope: "filtered" | "selected" | "page") => void
  selectedCount: number
  bulkActions?: (selectedRows: TData[]) => ReactNode
  onClearSelection: () => void
}) {
  const [searchDraft, setSearchDraft] = useState(globalFilter)

  useEffect(() => {
    const id = setTimeout(() => onGlobalFilterChange(searchDraft), 300)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft])

  const isFiltered = table.getState().columnFilters.length > 0 || globalFilter.length > 0

  if (selectedCount > 0) {
    return (
      <div className="bg-muted/50 flex items-center justify-between rounded-lg border px-3 py-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{selectedCount} selected</span>
          <Button variant="ghost" size="sm" className="h-7" onClick={onClearSelection}>
            <X className="size-3.5" />
            Clear
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {bulkActions?.(table.getSelectedRowModel().rows.map((row) => row.original))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {leading}
        <Input
          placeholder={searchPlaceholder}
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          className="h-8 w-48 lg:w-64"
        />
        {facetedFilters.map((filter) => (
          <DataTableFacetedFilter
            key={filter.columnId}
            column={table.getColumn(filter.columnId)}
            title={filter.title}
            options={filter.options}
          />
        ))}
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => {
              table.resetColumnFilters()
              setSearchDraft("")
              onGlobalFilterChange("")
            }}
          >
            Reset
            <X className="size-3.5" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {trailing}
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-8" />}>
            <Rows3 className="size-3.5" />
            Density
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(["compact", "normal", "comfortable"] as const).map((option) => (
              <DropdownMenuItem key={option} onClick={() => onDensityChange(option)}>
                <Check className={cn("size-3.5", option !== density && "invisible")} />
                <span className="capitalize">{option}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {onExport && (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-8" />}>
              <Download className="size-3.5" />
              Export
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onExport("filtered")}>Current view (CSV)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport("page")}>Current page (CSV)</DropdownMenuItem>
              <DropdownMenuItem
                disabled={table.getSelectedRowModel().rows.length === 0}
                onClick={() => onExport("selected")}
              >
                Selected rows (CSV)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  )
}

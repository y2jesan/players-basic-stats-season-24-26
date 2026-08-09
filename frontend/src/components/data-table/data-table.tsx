import type {
  ColumnDef,
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ExpandedState,
  PaginationState,
  RowSelectionState,
  SortingState,
  Updater,
  VisibilityState,
} from "@tanstack/react-table"
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronRight } from "lucide-react"
import type { ReactNode } from "react"
import { Fragment, useMemo, useState } from "react"

import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useControllableState } from "@/hooks/use-controllable-state"
import { useLocalStorageState } from "@/hooks/use-local-storage-state"
import { cn } from "@/lib/utils"

import { exportTableToCsv } from "@/components/data-table/csv-export"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions"
import type { FacetedFilterConfig } from "@/components/data-table/data-table-toolbar"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"

export type Density = "compact" | "normal" | "comfortable"

const DENSITY_ROW_CLASS: Record<Density, string> = {
  compact: "[&_td]:py-1 [&_th]:py-1",
  normal: "[&_td]:py-2 [&_th]:py-2",
  comfortable: "[&_td]:py-3.5 [&_th]:py-3.5",
}

type PersistedViewState = {
  columnOrder: ColumnOrderState
  columnPinning: ColumnPinningState
  columnSizing: ColumnSizingState
  columnVisibility: VisibilityState
  density: Density
}

const DEFAULT_VIEW_STATE: PersistedViewState = {
  columnOrder: [],
  columnPinning: {},
  columnSizing: {},
  columnVisibility: {},
  density: "normal",
}

export type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  mode?: "client" | "server"
  isLoading?: boolean
  /** Required in server mode. */
  pageCount?: number
  /** Total row count across all pages; defaults to data.length in client mode. */
  rowCount?: number

  sorting?: SortingState
  onSortingChange?: (updater: Updater<SortingState>) => void
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: (updater: Updater<ColumnFiltersState>) => void
  globalFilter?: string
  onGlobalFilterChange?: (value: string) => void
  pagination?: PaginationState
  onPaginationChange?: (updater: Updater<PaginationState>) => void

  /** localStorage key for persisting column order/pinning/sizing/visibility/density. */
  tableId?: string
  /** Columns hidden on first load (before any localStorage state exists); still toggleable via View. */
  defaultColumnVisibility?: VisibilityState
  getRowId?: (row: TData) => string
  onRowClick?: (row: TData) => void
  /** Render the table at its natural column width (fills the card) instead of scrolling horizontally. */
  fitWidth?: boolean
  /** Show every row at once, with no pagination controls. */
  hidePagination?: boolean

  toolbar?: {
    searchPlaceholder?: string
    /** Extra content rendered before the search input, e.g. filter pickers. */
    leading?: ReactNode
    facetedFilters?: FacetedFilterConfig[]
    /** Extra content rendered at the start of the right-side button cluster (Density/Export/View). */
    trailing?: ReactNode
  }

  enableRowSelection?: boolean
  bulkActions?: (selectedRows: TData[]) => ReactNode
  rowActions?: (row: TData) => ReactNode
  renderSubComponent?: (row: TData) => ReactNode
  /** Escape hatch for server mode, where client-side CSV export only covers the loaded page. */
  onExportRequest?: (scope: "filtered" | "selected" | "page") => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  mode = "client",
  isLoading = false,
  pageCount,
  rowCount,
  sorting: controlledSorting,
  onSortingChange,
  columnFilters: controlledColumnFilters,
  onColumnFiltersChange,
  globalFilter: controlledGlobalFilter,
  onGlobalFilterChange,
  pagination: controlledPagination,
  onPaginationChange,
  tableId,
  defaultColumnVisibility,
  getRowId,
  onRowClick,
  fitWidth = false,
  hidePagination = false,
  toolbar,
  enableRowSelection = false,
  bulkActions,
  rowActions,
  renderSubComponent,
  onExportRequest,
}: DataTableProps<TData, TValue>) {
  const isServer = mode === "server"

  const [sorting, setSorting] = useControllableState<SortingState>(controlledSorting, onSortingChange, [])
  const [columnFilters, setColumnFilters] = useControllableState<ColumnFiltersState>(
    controlledColumnFilters,
    onColumnFiltersChange,
    []
  )
  const [globalFilter, setGlobalFilterRaw] = useControllableState<string>(
    controlledGlobalFilter,
    onGlobalFilterChange ? (updater) => onGlobalFilterChange(resolveUpdater(updater, controlledGlobalFilter ?? "")) : undefined,
    ""
  )
  const [pagination, setPagination] = useControllableState<PaginationState>(controlledPagination, onPaginationChange, {
    pageIndex: 0,
    pageSize: 10,
  })

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [expanded, setExpanded] = useState<ExpandedState>({})

  const [viewState, setViewState] = useLocalStorageState<PersistedViewState>(
    tableId ? `data-table:${tableId}` : undefined,
    defaultColumnVisibility
      ? { ...DEFAULT_VIEW_STATE, columnVisibility: defaultColumnVisibility }
      : DEFAULT_VIEW_STATE
  )
  const updateViewState = (patch: Partial<PersistedViewState>) => setViewState({ ...viewState, ...patch })

  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null)

  const allColumns = useMemo(() => {
    const cols: ColumnDef<TData, TValue>[] = []

    if (enableRowSelection) {
      cols.push({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            onClick={(e) => e.stopPropagation()}
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 36,
      })
    }

    if (renderSubComponent) {
      cols.push({
        id: "expand",
        header: () => null,
        cell: ({ row }) =>
          row.getCanExpand() ? (
            <button
              type="button"
              onClick={row.getToggleExpandedHandler()}
              className="text-muted-foreground hover:text-primary"
              aria-label={row.getIsExpanded() ? "Collapse row" : "Expand row"}
            >
              <ChevronRight className={cn("size-4 transition-transform", row.getIsExpanded() && "rotate-90")} />
            </button>
          ) : null,
        enableSorting: false,
        enableHiding: false,
        size: 32,
      })
    }

    cols.push(...columns)

    if (rowActions) {
      cols.push({
        id: "actions",
        header: () => null,
        cell: ({ row }) => <DataTableRowActions>{rowActions(row.original)}</DataTableRowActions>,
        enableSorting: false,
        enableHiding: false,
        size: 40,
      })
    }

    return cols
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, enableRowSelection, renderSubComponent, rowActions])

  const table = useReactTable({
    data,
    columns: allColumns,
    getRowId,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
      rowSelection,
      expanded,
      columnOrder: viewState.columnOrder,
      columnPinning: viewState.columnPinning,
      columnSizing: viewState.columnSizing,
      columnVisibility: viewState.columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilterRaw,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    onExpandedChange: setExpanded,
    onColumnOrderChange: (updater) =>
      updateViewState({ columnOrder: resolveUpdater(updater, viewState.columnOrder) }),
    onColumnPinningChange: (updater) =>
      updateViewState({ columnPinning: resolveUpdater(updater, viewState.columnPinning) }),
    onColumnSizingChange: (updater) =>
      updateViewState({ columnSizing: resolveUpdater(updater, viewState.columnSizing) }),
    onColumnVisibilityChange: (updater) =>
      updateViewState({ columnVisibility: resolveUpdater(updater, viewState.columnVisibility) }),
    getRowCanExpand: () => !!renderSubComponent,
    manualSorting: isServer,
    manualFiltering: isServer,
    manualPagination: isServer,
    pageCount: isServer ? (pageCount ?? -1) : undefined,
    rowCount: isServer ? rowCount : undefined,
    enableRowSelection,
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: renderSubComponent ? getExpandedRowModel() : undefined,
    getSortedRowModel: isServer ? undefined : getSortedRowModel(),
    getFilteredRowModel: isServer ? undefined : getFilteredRowModel(),
    getPaginationRowModel: isServer || hidePagination ? undefined : getPaginationRowModel(),
    getFacetedRowModel: isServer ? undefined : getFacetedRowModel(),
    getFacetedUniqueValues: isServer ? undefined : getFacetedUniqueValues(),
  })

  const effectiveRowCount = isServer ? (rowCount ?? 0) : table.getFilteredRowModel().rows.length
  const centerLeafColumnIds = table.getCenterVisibleLeafColumns().map((c) => c.id)

  function handleDrop(targetColumnId: string) {
    if (!draggedColumnId || draggedColumnId === targetColumnId) return
    const currentOrder = viewState.columnOrder.length
      ? viewState.columnOrder
      : table.getAllLeafColumns().map((c) => c.id)
    const next = [...currentOrder]
    const from = next.indexOf(draggedColumnId)
    const to = next.indexOf(targetColumnId)
    if (from === -1 || to === -1) return
    next.splice(from, 1)
    next.splice(to, 0, draggedColumnId)
    updateViewState({ columnOrder: next })
    setDraggedColumnId(null)
  }

  const rows = table.getRowModel().rows

  return (
    <div className="flex flex-col gap-3">
      <DataTableToolbar
        table={table}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilterRaw}
        searchPlaceholder={toolbar?.searchPlaceholder}
        leading={toolbar?.leading}
        facetedFilters={toolbar?.facetedFilters}
        trailing={toolbar?.trailing}
        density={viewState.density}
        onDensityChange={(density) => updateViewState({ density })}
        onExport={
          onExportRequest ?? (mode === "client" ? (scope) => exportTableToCsv(table, scope, "export.csv") : undefined)
        }
        selectedCount={Object.keys(rowSelection).length}
        bulkActions={bulkActions}
        onClearSelection={() => setRowSelection({})}
      />

      <div className="overflow-hidden rounded-lg border">
        <ScrollArea className={cn(!hidePagination && "max-h-128")}>
          <Table
            className={cn(DENSITY_ROW_CLASS[viewState.density], fitWidth && "w-full")}
            style={fitWidth ? undefined : { width: table.getTotalSize() }}
          >
            <TableHeader className="bg-background sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const isPinned = header.column.getIsPinned()
                    const isDraggable = !isPinned && centerLeafColumnIds.includes(header.column.id)
                    const isSorted = !!header.column.getIsSorted()
                    return (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        draggable={isDraggable}
                        onDragStart={() => setDraggedColumnId(header.column.id)}
                        onDragOver={(e) => isDraggable && e.preventDefault()}
                        onDrop={() => isDraggable && handleDrop(header.column.id)}
                        className={cn(
                          "relative select-none",
                          isPinned === "left" && "sticky left-0 z-20",
                          isPinned === "right" && "sticky right-0 z-20",
                          isPinned ? "bg-background" : isSorted && "bg-primary/30 dark:bg-primary/55",
                          isDraggable && "cursor-grab"
                        )}
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanResize() && (
                          <div
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            className={cn(
                              "absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none select-none",
                              header.column.getIsResizing() && "bg-primary"
                            )}
                          />
                        )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: pagination.pageSize }).map((_, i) => (
                  <TableRow key={i}>
                    {allColumns.map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={allColumns.length} className="text-muted-foreground h-32 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <Fragment key={row.id}>
                    <TableRow
                      data-state={row.getIsSelected() && "selected"}
                      onClick={() => onRowClick?.(row.original)}
                      className={cn(onRowClick && "cursor-pointer hover:bg-accent")}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const isPinned = cell.column.getIsPinned()
                        const isSorted = !!cell.column.getIsSorted()
                        return (
                          <TableCell
                            key={cell.id}
                            className={cn(
                              isPinned === "left" && "sticky left-0 z-10",
                              isPinned === "right" && "sticky right-0 z-10",
                              isPinned ? "bg-background" : isSorted && "bg-primary/16 dark:bg-primary/32"
                            )}
                            style={{ width: cell.column.getSize() }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                    {row.getIsExpanded() && renderSubComponent && (
                      <TableRow>
                        <TableCell colSpan={allColumns.length} className="bg-muted/30">
                          {renderSubComponent(row.original)}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))
              )}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {!hidePagination && <DataTablePagination table={table} rowCount={effectiveRowCount} />}
    </div>
  )
}

function resolveUpdater<T>(updater: Updater<T>, current: T): T {
  return typeof updater === "function" ? (updater as (old: T) => T)(current) : updater
}

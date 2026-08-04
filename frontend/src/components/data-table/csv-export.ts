import type { Table } from "@tanstack/react-table"

function escapeCsvValue(value: unknown): string {
  const str = value == null ? "" : String(value)
  if (/[",\r\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

// Hand-rolled CSV export — no added dependency. Exports whatever's currently loaded client-side;
// in server mode that's only the current page unless the caller wires DataTable's `onExportRequest`.
export function exportTableToCsv<TData>(
  table: Table<TData>,
  scope: "filtered" | "selected" | "page",
  filename: string
) {
  const columns = table
    .getVisibleLeafColumns()
    .filter((col) => !["select", "actions", "expand"].includes(col.id))

  const rows =
    scope === "selected"
      ? table.getSelectedRowModel().rows
      : scope === "page"
        ? table.getRowModel().rows
        : table.getFilteredRowModel().rows

  const header = columns.map((col) => escapeCsvValue(col.columnDef.meta?.label ?? col.id)).join(",")
  const body = rows
    .map((row) => columns.map((col) => escapeCsvValue(row.getValue(col.id))).join(","))
    .join("\r\n")
  const csv = `${header}\r\n${body}`

  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

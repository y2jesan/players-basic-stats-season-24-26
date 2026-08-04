import "@tanstack/react-table"

// TanStack Table's recommended way to type per-column `meta` (see their docs).
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    label?: string
  }
}

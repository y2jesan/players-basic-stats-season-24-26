import type { Column } from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ChevronDown, ChevronsUpDown, EyeOff, Pin, PinOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// Column header. Clicking the label sorts via TanStack's native toggle handler, which reads
// event.shiftKey itself — that's what gives us multi-column sort on shift-click for free.
// The chevron menu covers the non-pointer paths: explicit asc/desc, reset, pin, hide.
export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: {
  column: Column<TData, TValue>
  title: string
  className?: string
}) {
  const canSort = column.getCanSort()
  const canPin = column.getCanPin()
  const canHide = column.getCanHide()
  const sorted = column.getIsSorted()
  const sortIndex = column.getSortIndex()
  const pinned = column.getIsPinned()

  if (!canSort && !canPin && !canHide) {
    return <div className={className}>{title}</div>
  }

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {canSort ? (
        <button
          type="button"
          className="hover:text-foreground -ml-2.5 flex items-center gap-1.5 rounded px-2.5 py-1 text-sm font-medium"
          onClick={column.getToggleSortingHandler()}
        >
          <span>{title}</span>
          {sorted === "desc" ? (
            <ArrowDown className="size-3.5" />
          ) : sorted === "asc" ? (
            <ArrowUp className="size-3.5" />
          ) : (
            <ChevronsUpDown className="text-muted-foreground/60 size-3.5" />
          )}
          {sorted && sortIndex > 0 && (
            <span className="text-muted-foreground text-[0.65rem]">{sortIndex + 1}</span>
          )}
        </button>
      ) : (
        <span className="px-2.5 py-1 text-sm font-medium">{title}</span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" />}>
          <ChevronDown className="text-muted-foreground/60 size-3" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {canSort && (
            <>
              <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                <ArrowUp className="text-muted-foreground/70 size-3.5" />
                Asc
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                <ArrowDown className="text-muted-foreground/70 size-3.5" />
                Desc
              </DropdownMenuItem>
              {sorted && (
                <DropdownMenuItem onClick={() => column.clearSorting()}>
                  <ChevronsUpDown className="text-muted-foreground/70 size-3.5" />
                  Reset sort
                </DropdownMenuItem>
              )}
            </>
          )}
          {canPin && (
            <>
              {canSort && <DropdownMenuSeparator />}
              {pinned !== "left" && (
                <DropdownMenuItem onClick={() => column.pin("left")}>
                  <Pin className="text-muted-foreground/70 size-3.5" />
                  Pin left
                </DropdownMenuItem>
              )}
              {pinned !== "right" && (
                <DropdownMenuItem onClick={() => column.pin("right")}>
                  <Pin className="text-muted-foreground/70 size-3.5" />
                  Pin right
                </DropdownMenuItem>
              )}
              {pinned && (
                <DropdownMenuItem onClick={() => column.pin(false)}>
                  <PinOff className="text-muted-foreground/70 size-3.5" />
                  Unpin
                </DropdownMenuItem>
              )}
            </>
          )}
          {canHide && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
                <EyeOff className="text-muted-foreground/70 size-3.5" />
                Hide
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

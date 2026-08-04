import type { Column } from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ChevronDown, ChevronsUpDown, EyeOff, Pin, PinOff } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

// Column header. Clicking the label sorts via TanStack's native toggle handler, which reads
// event.shiftKey itself — that's what gives us multi-column sort on shift-click for free.
// The chevron menu covers the non-pointer paths: explicit asc/desc, reset, pin, hide.
export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  description,
  className,
}: {
  column: Column<TData, TValue>
  title: string
  description?: string
  className?: string
}) {
  const canSort = column.getCanSort()
  const canPin = column.getCanPin()
  const canHide = column.getCanHide()
  const sorted = column.getIsSorted()
  const sortIndex = column.getSortIndex()
  const pinned = column.getIsPinned()

  const titleClass = cn(description && "underline decoration-dotted underline-offset-2")

  // Content shown inside whichever interactive wrapper below ends up hosting it.
  const headerContent = canSort ? (
    <>
      <span className={titleClass}>{title}</span>
      {sorted === "desc" ? (
        <ArrowDown className="size-3.5" />
      ) : sorted === "asc" ? (
        <ArrowUp className="size-3.5" />
      ) : (
        <ChevronsUpDown className="text-muted-foreground/60 size-3.5" />
      )}
      {sorted && sortIndex > 0 && <span className="text-muted-foreground text-[0.65rem]">{sortIndex + 1}</span>}
    </>
  ) : (
    <span className={titleClass}>{title}</span>
  )

  const sortButtonProps = {
    type: "button" as const,
    className: "hover:text-foreground -ml-2.5 flex items-center gap-1.5 rounded px-2.5 py-1 text-sm font-medium",
    onClick: column.getToggleSortingHandler(),
  }

  let headerLabel: ReactNode
  if (description) {
    // Merge the tooltip trigger onto the same element that handles sorting (via `render`)
    // instead of nesting a second interactive element inside the sort <button>.
    headerLabel = (
      <Tooltip>
        <TooltipTrigger
          render={canSort ? <button {...sortButtonProps} /> : <span className="cursor-default px-2.5 py-1 text-sm font-medium" />}
        >
          {headerContent}
        </TooltipTrigger>
        <TooltipContent>{description}</TooltipContent>
      </Tooltip>
    )
  } else if (canSort) {
    headerLabel = <button {...sortButtonProps}>{headerContent}</button>
  } else {
    headerLabel = <span className="px-2.5 py-1 text-sm font-medium">{headerContent}</span>
  }

  if (!canSort && !canPin && !canHide) {
    return <div className={className}>{headerLabel}</div>
  }

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {headerLabel}
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

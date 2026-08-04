import type { LucideIcon } from "lucide-react"
import { TrendingDown, TrendingUp } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

// Single metric tile: a label, a big value, an optional up/down delta, and an optional icon.
// Pass onClick to make it a clickable link out to wherever this metric is broken down further.
export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  onClick,
}: {
  label: string
  value: string | number
  delta?: { value: string; direction: "up" | "down" }
  icon?: LucideIcon
  onClick?: () => void
}) {
  return (
    <Card
      onClick={onClick}
      className={cn(onClick && "cursor-pointer transition-colors hover:bg-accent")}
    >
      <CardContent className="flex items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="font-heading mt-1 text-2xl font-semibold tracking-tight">{value}</p>
          {delta && (
            <p
              className={cn(
                "mt-1 flex items-center gap-1 text-xs font-medium",
                delta.direction === "up" ? "text-chart-2" : "text-destructive"
              )}
            >
              {delta.direction === "up" ? (
                <TrendingUp className="size-3.5" />
              ) : (
                <TrendingDown className="size-3.5" />
              )}
              {delta.value}
            </p>
          )}
        </div>
        {Icon && (
          <div className="bg-muted text-muted-foreground rounded-lg p-2">
            <Icon className="size-5" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4">
        <div className="w-full">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="mt-2 h-7 w-16" />
          <Skeleton className="mt-2 h-3.5 w-24" />
        </div>
        <Skeleton className="size-9 rounded-lg" />
      </CardContent>
    </Card>
  )
}

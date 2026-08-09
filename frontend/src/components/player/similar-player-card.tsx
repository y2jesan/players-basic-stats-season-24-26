import { Link } from "@tanstack/react-router"
import { GitCompareArrows, Plus, Sparkles } from "lucide-react"

import { PositionBadge } from "@/components/player/position-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getInitials, initialsTileStyle } from "@/lib/initials-color"
import { cn } from "@/lib/utils"
import type { SimilarPlayerSummary } from "@/types/football"

type SimilarPlayerAction =
  | { type: "compare"; search: { p1: string; p2: string; season?: string } }
  | { type: "add"; onAdd: () => void; disabled?: boolean }

const YOUNG_AGE_MAX = 23
const DEFAULT_STAT_COUNT = 5

export function SimilarPlayerCard({
  player,
  season,
  action,
  statCount = DEFAULT_STAT_COUNT,
}: {
  player: SimilarPlayerSummary
  season?: string
  action?: SimilarPlayerAction
  statCount?: number
}) {
  const isYoung = player.age != null && player.age <= YOUNG_AGE_MAX

  return (
    <Card
      size="sm"
      className={cn("gap-2", isYoung && "ring-2 ring-emerald-500/50 dark:ring-emerald-400/40")}
    >
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white"
              style={initialsTileStyle(player.name)}
            >
              {getInitials(player.name)}
            </div>
            <div className="flex flex-col">
              <Link
                to="/players/$playerId"
                params={{ playerId: player.player_id }}
                search={{ season }}
                className="hover:text-primary text-xs font-medium underline-offset-2 hover:underline"
              >
                {player.name}
              </Link>
              <span className="text-muted-foreground text-[0.7rem]">{player.team_name}</span>
            </div>
          </div>
          {action?.type === "add" && (
            <Button variant="outline" size="icon-xs" onClick={action.onAdd} disabled={action.disabled}>
              <Plus className="size-3.5" />
            </Button>
          )}
          {action?.type === "compare" && (
            <Button
              variant="outline"
              size="icon-xs"
              nativeButton={false}
              render={<Link to="/compare" search={action.search} />}
            >
              <GitCompareArrows className="size-3.5" />
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {player.positions.map((pos) => (
            <PositionBadge key={pos} position={pos} />
          ))}
          {player.age != null && <span className="text-muted-foreground text-[0.7rem]">{player.age} yrs</span>}
          {isYoung && (
            <Badge className="bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <Sparkles />
              Young
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
          {player.stats.slice(0, statCount).map((stat) => (
            <div key={stat.key} className="flex items-baseline justify-between gap-1.5">
              <span className="text-muted-foreground text-[0.7rem]">{stat.label}</span>
              <span className="text-xs font-medium tabular-nums">{stat.value ?? "—"}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

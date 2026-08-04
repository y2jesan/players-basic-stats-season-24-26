import { Trophy } from "lucide-react"

import { cn } from "@/lib/utils"

const MEDAL_CLASS: Record<number, string> = {
  1: "fill-yellow-400 text-yellow-500",
  2: "fill-slate-300 text-slate-400",
  3: "fill-amber-600 text-amber-700",
}

export function RankIcon({ rank }: { rank: number }) {
  const medalClass = MEDAL_CLASS[rank]
  if (!medalClass) {
    return <span className="text-muted-foreground text-xs tabular-nums">{rank}</span>
  }
  return <Trophy className={cn("size-3.5 shrink-0", medalClass)} aria-label={`Rank ${rank}`} />
}

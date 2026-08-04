import { Link, useRouter, useRouterState } from "@tanstack/react-router"
import { ArrowLeft, Trophy } from "lucide-react"

import { ThemeToggle } from "@/components/layout/theme-toggle"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useClock } from "@/hooks/use-clock"
import { useSeason } from "@/hooks/use-season"
import { NAV_ITEMS } from "@/lib/nav"
import { cn } from "@/lib/utils"

// Detail routes (/teams/$id, /players/$id, ...) have no nav entry of their own, so their
// label is derived from a prefix match here instead of NAV_ITEMS.
const DETAIL_ROUTE_LABELS: [prefix: string, label: string][] = [
  ["/teams/", "Team"],
  ["/players/", "Player"],
  ["/countries/", "Country"],
  ["/leaderboards/", "Leaderboard"],
]

export function Navbar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const router = useRouter()
  const { formatted, timeZone } = useClock()
  const { season, setSeason, seasons } = useSeason()
  const detailLabel = DETAIL_ROUTE_LABELS.find(([prefix]) => pathname.startsWith(prefix))?.[1]

  return (
    <header className="bg-background/95 sticky top-0 z-10 flex h-14 shrink-0 items-center gap-4 border-b px-4 backdrop-blur">
      <Link to="/" className="flex items-center gap-2">
        <Trophy className="text-primary size-5" />
        <span className="font-heading hidden text-base font-semibold sm:inline">Football Analytics</span>
      </Link>

      <Separator orientation="vertical" className="h-4" />

      <nav className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.url}
            to={item.url}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium transition-colors",
              pathname === item.url
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="size-4" />
            <span className="hidden sm:inline">{item.title}</span>
          </Link>
        ))}
      </nav>

      {detailLabel && (
        <>
          <Separator orientation="vertical" className="h-4" />
          <Button variant="ghost" size="sm" onClick={() => router.history.back()}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <span className="text-muted-foreground text-sm">{detailLabel}</span>
        </>
      )}

      <div className="text-muted-foreground ml-auto flex items-center gap-4 text-sm">
        <span className="hidden sm:inline">{timeZone}</span>
        <span className="font-mono tabular-nums">{formatted}</span>

        <Separator orientation="vertical" className="h-4" />

        <Select value={season} onValueChange={(value) => value && setSeason(value)}>
          <SelectTrigger size="sm">
            <SelectValue placeholder="Season" />
          </SelectTrigger>
          <SelectContent>
            {seasons?.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ThemeToggle />
      </div>
    </header>
  )
}

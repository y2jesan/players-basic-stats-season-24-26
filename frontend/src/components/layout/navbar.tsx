import { Link, useRouterState } from "@tanstack/react-router"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { useClock } from "@/hooks/use-clock"
import { NAV_ITEMS } from "@/lib/nav"

// Detail routes (/teams/$id, /players/$id, ...) have no nav entry of their own, so their
// breadcrumb label falls back to a prefix match here instead of NAV_ITEMS.
const DETAIL_ROUTE_LABELS: [prefix: string, label: string][] = [
  ["/teams/", "Team"],
  ["/players/", "Player"],
  ["/countries/", "Country"],
]

export function Navbar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { formatted, timeZone } = useClock()
  const current = NAV_ITEMS.find((item) => item.url === pathname)
  const breadcrumbLabel =
    current?.title ??
    DETAIL_ROUTE_LABELS.find(([prefix]) => pathname.startsWith(prefix))?.[1] ??
    "Not found"

  return (
    <header className="bg-background/95 sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink render={<Link to="/" />}>Football Analytics</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>{breadcrumbLabel}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="text-muted-foreground ml-auto flex items-center gap-4 text-sm">
        <span className="hidden sm:inline">{timeZone}</span>
        <span className="font-mono tabular-nums">{formatted}</span>
        <ThemeToggle />
      </div>
    </header>
  )
}

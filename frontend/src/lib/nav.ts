import { ChartScatter, LayoutDashboard, ListOrdered } from "lucide-react"

// Sidebar nav items, also used to derive navbar breadcrumb labels from the current route path.
// Teams and players are browsed by clicking through from the overview page, not via nav entries.
export const NAV_ITEMS = [
  { title: "Overview", url: "/", icon: LayoutDashboard },
  { title: "Leaderboards", url: "/leaderboards", icon: ListOrdered },
  { title: "Analysis", url: "/analysis", icon: ChartScatter },
] as const

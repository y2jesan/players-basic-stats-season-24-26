import { ChartScatter, LayoutDashboard } from "lucide-react"

// Sidebar nav items, also used to derive navbar breadcrumb labels from the current route path.
// Teams and players are browsed by clicking through from the dashboard, not via nav entries.
export const NAV_ITEMS = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Analysis", url: "/analysis", icon: ChartScatter },
] as const

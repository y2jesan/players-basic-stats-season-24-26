import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// GK/DF/MF/FW each get a distinct hue so a roster's shape reads at a glance without
// having to parse the text — red (GK), orange (DF), green (MF), blue (FW).
const POSITION_STYLES: Record<string, string> = {
  GK: "bg-red-500/15 text-red-600 dark:bg-red-500/20 dark:text-red-400",
  DF: "bg-orange-500/15 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400",
  MF: "bg-green-500/15 text-green-600 dark:bg-green-500/20 dark:text-green-400",
  FW: "bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
}

export function PositionBadge({ position }: { position: string }) {
  return (
    <Badge variant="secondary" className={cn(POSITION_STYLES[position])}>
      {position}
    </Badge>
  )
}

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// A small accent dot marking an advanced/expected-value stat (xG, xAG, GCA, ...) among
// plain counting stats. No tooltip of its own — it sits inside headers/labels that
// already carry the stat's glossary description, so a second nested tooltip would just
// compete with that one for hover focus.
export function AdvancedStatIndicator({ className }: { className?: string }) {
  return (
    <Badge
      aria-label="Advanced/expected-value stat"
      variant="outline"
      className={cn("size-1.5 shrink-0 rounded-full border-none bg-sky-500 p-0 dark:bg-sky-400", className)}
    />
  )
}

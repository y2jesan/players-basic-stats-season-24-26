import { Maximize2 } from "lucide-react"
import type { ReactNode } from "react"

import { PositionRadarChart, type RadarSeries } from "@/components/stat/position-radar-chart"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

// Trigger + fullscreen dialog for a single chart — used identically on the player
// detail page (one radar per position) and the compare page (one radar per stat
// category), so players/analysts can blow a chart up to compare shapes and read axis
// labels without the small inline size cramping things.
export function ChartExpandDialog({ title, series }: { title: ReactNode; series: RadarSeries[] }) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" className="text-muted-foreground" />}>
        <Maximize2 className="size-4" />
        <span className="sr-only">Expand chart</span>
      </DialogTrigger>
      <DialogContent
        showCloseButton={true}
        className="flex h-[90vh] w-[95vw] max-w-none flex-col items-center gap-4 sm:max-w-none"
      >
        <DialogHeader className="w-full">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-1 items-center justify-center overflow-auto">
          <PositionRadarChart series={series} size="xl" />
        </div>
      </DialogContent>
    </Dialog>
  )
}

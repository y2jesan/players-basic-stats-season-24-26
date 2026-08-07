import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from "recharts"

import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart"
import { cn } from "@/lib/utils"
import type { RadarAxis, RadarChartData } from "@/types/football"

export type RadarSeries = {
  id: string
  label: string
  color: string
  chart: RadarChartData
}

const MIN_AXES_WITH_DATA = 4

// Short forms of the (sometimes long, e.g. "Touches in Attacking Penalty Area") backend
// stat labels, keyed by stat key — used only for the compact polar-axis ticks; the
// tooltip still shows the full label so nothing is actually lost, just abbreviated on-chart.
const SHORT_AXIS_LABELS: Record<string, string> = {
  "Save%": "Save %",
  "CS%": "Clean Sheet %",
  "PSxG+/-": "PSxG +/-",
  GA90: "GA / 90",
  "Cmp%": "Pass Cmp %",
  "Launch%": "Launch %",
  "Stp%": "Cross Stop %",
  "#OPA/90": "OPA / 90",
  "Tkl+Int": "Tkl + Int",
  "Tkl%": "Tackle %",
  Clr: "Clearances",
  "Won%": "Aerial Won %",
  Blocks_stats_defense: "Blocks",
  PrgP: "Prog. Passes",
  CrdY: "Yellow Cards",
  Int: "Interceptions",
  KP: "Key Passes",
  SCA90: "SCA / 90",
  PrgC: "Prog. Carries",
  "Succ%": "Take-On %",
  Gls: "Goals",
  npxG: "npxG",
  "SoT%": "SoT %",
  Ast: "Assists",
  "Att Pen": "Att Pen Touches",
  GCA90: "GCA / 90",
}

export function hasEnoughRadarData(chart: RadarChartData): boolean {
  return chart.axes.filter((axis) => axis.percentile !== null).length >= MIN_AXES_WITH_DATA
}

// SHORT_AXIS_LABELS only covers the curated position-radar stat keys — the compare
// page's per-category charts can surface any of the ~270 stat keys in the dataset, so
// anything not in that map falls back to truncation. The tooltip always shows the
// untruncated `fullLabel`, so nothing is actually lost.
const MAX_TICK_LABEL_CHARS = 13

function axisTickLabel(key: string, fullLabel: string, maxChars: number): string {
  const override = SHORT_AXIS_LABELS[key]
  if (override && override.length <= maxChars) return override
  if (fullLabel.length <= maxChars) return fullLabel
  return `${fullLabel.slice(0, maxChars - 1).trimEnd()}…`
}

type RadarRow = { label: string; fullLabel: string; axesBySeries: Record<string, RadarAxis | undefined> } &
  Record<string, unknown>

export function PositionRadarChart({ series, size = "md" }: { series: RadarSeries[]; size?: "md" | "lg" | "xl" }) {
  if (series.length === 0) return null

  // Fixed absolute size (not w-full/max-w-*) so this never depends on an ancestor
  // resolving a percentage width — any `items-center` flex ancestor anywhere up the
  // tree (very likely, given how many places this gets embedded) shrink-wraps its
  // children instead of stretching them, which leaves a percentage-width descendant
  // with no definite width to resolve against and collapses it to ~0. "xl" (the
  // fullscreen-dialog view) uses a viewport-relative size instead of a fixed px value
  // for the same reason `size-*` was chosen over `w-full` — vmin is relative to the
  // viewport, never to an ancestor, so it's equally immune to that bug while still
  // scaling with the screen instead of being a single fixed pixel value.
  const dims = size === "xl" ? "size-[min(70vh,70vw)]" : size === "lg" ? "size-96" : "size-72"
  const margin =
    size === "xl"
      ? { top: 28, right: 80, bottom: 28, left: 80 }
      : size === "lg"
        ? { top: 20, right: 64, bottom: 20, left: 64 }
        : { top: 16, right: 48, bottom: 16, left: 48 }
  const fontSize = size === "xl" ? 14 : size === "lg" ? 12 : 11
  const maxTickChars = size === "xl" ? 19 : MAX_TICK_LABEL_CHARS

  const reference = series[0].chart.axes
  const data: RadarRow[] = reference.map((refAxis, i) => {
    const axesBySeries: Record<string, RadarAxis | undefined> = {}
    const row: RadarRow = {
      label: axisTickLabel(refAxis.key, refAxis.label, maxTickChars),
      fullLabel: refAxis.label,
      axesBySeries,
    }
    for (const s of series) {
      const axis = s.chart.axes[i]
      axesBySeries[s.id] = axis
      row[s.id] = axis?.percentile ?? 0
    }
    return row
  })

  const availableCount = reference.filter((axis) => axis.percentile !== null).length

  const config: ChartConfig = Object.fromEntries(series.map((s) => [s.id, { label: s.label, color: s.color }]))

  return (
    <div className="flex flex-col items-center gap-2">
      <ChartContainer config={config} className={cn("mx-auto shrink-0", dims)}>
        <RadarChart data={data} outerRadius={size === "xl" ? "70%" : "60%"} margin={margin}>
          <ChartTooltip content={<RadarTooltip series={series} />} />
          <PolarGrid />
          <PolarAngleAxis dataKey="label" tick={{ fontSize }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} tickCount={5} />
          {series.map((s) => (
            <Radar
              key={s.id}
              dataKey={s.id}
              name={s.label}
              stroke={s.color}
              fill={s.color}
              fillOpacity={series.length > 1 ? 0.15 : 0.35}
              strokeWidth={2}
            />
          ))}
        </RadarChart>
      </ChartContainer>
      {series.length > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          {series.map((s) => (
            <span key={s.id} className="flex items-center gap-1.5 text-xs">
              <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-muted-foreground">{s.label}</span>
            </span>
          ))}
        </div>
      )}
      {availableCount < reference.length && (
        <span className="text-muted-foreground text-xs">
          {availableCount} of {reference.length} stats available this season
        </span>
      )}
    </div>
  )
}

function RadarTooltip({
  active,
  payload,
  series,
}: {
  active?: boolean
  payload?: { payload: RadarRow }[]
  series: RadarSeries[]
}) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload

  return (
    <div className="bg-background grid min-w-40 gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
      <div className="font-medium">{row.fullLabel}</div>
      <div className="grid gap-1">
        {series.map((s) => {
          const axis = row.axesBySeries[s.id]
          return (
            <div key={s.id} className="flex items-center gap-2">
              <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-muted-foreground flex-1">{s.label}</span>
              {axis?.percentile != null ? (
                <span className="font-mono font-medium tabular-nums">
                  {axis.value} (p{axis.percentile})
                </span>
              ) : (
                <span className="text-muted-foreground italic">no data</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

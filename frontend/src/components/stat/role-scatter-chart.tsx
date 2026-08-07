import { useNavigate } from "@tanstack/react-router"
import { CartesianGrid, ReferenceLine, Scatter, ScatterChart, XAxis, YAxis } from "recharts"

import { POSITION_COLORS } from "@/components/player/position-badge"
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart"
import { useSeason } from "@/hooks/use-season"
import type { ScatterChartData, ScatterPoint } from "@/types/football"

const DEFAULT_COLOR = "#6366f1"
const POSITION_ORDER = ["GK", "DF", "MF", "FW"]
const POSITION_NAMES: Record<string, string> = {
  GK: "Goalkeeper",
  DF: "Defender",
  MF: "Midfielder",
  FW: "Forward",
}

type Point = ScatterPoint & { x: number; y: number }

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

export function RoleScatterChart({ data }: { data: ScatterChartData }) {
  const navigate = useNavigate()
  const { season } = useSeason()

  const points = data.points.filter((p): p is Point => p.x != null && p.y != null)

  if (points.length === 0) {
    return (
      <div className="text-muted-foreground flex h-64 items-center justify-center text-xs">
        No data this season
      </div>
    )
  }

  const meanX = average(points.map((p) => p.x))
  const meanY = average(points.map((p) => p.y))
  const config: ChartConfig = { value: { label: data.y_label, color: DEFAULT_COLOR } }
  const positionsPresent = POSITION_ORDER.filter((pos) => points.some((p) => p.positions[0] === pos))

  return (
    <div className="flex flex-col items-center gap-2">
      <ChartContainer config={config} className="aspect-auto h-64 w-full">
        <ScatterChart margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="x"
            name={data.x_label}
            label={{ value: data.x_label, position: "insideBottom", offset: -14, fontSize: 11 }}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={data.y_label}
            label={{ value: data.y_label, angle: -90, position: "insideLeft", fontSize: 11 }}
            tick={{ fontSize: 11 }}
            width={44}
          />
          <ReferenceLine x={meanX} stroke="var(--border)" strokeDasharray="4 4" />
          <ReferenceLine y={meanY} stroke="var(--border)" strokeDasharray="4 4" />
          <ChartTooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={<ScatterTooltip xLabel={data.x_label} yLabel={data.y_label} />}
          />
          <Scatter
            data={points}
            shape={(props: unknown) => <ScatterDot {...(props as ScatterDotProps)} />}
            onClick={(point) => {
              const row = point as unknown as Point
              navigate({ to: "/players/$playerId", params: { playerId: row.player_id }, search: { season } })
            }}
            isAnimationActive={false}
          />
        </ScatterChart>
      </ChartContainer>
      {positionsPresent.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          {positionsPresent.map((pos) => (
            <span key={pos} className="flex items-center gap-1.5 text-xs">
              <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: POSITION_COLORS[pos] }} />
              <span className="text-muted-foreground">{POSITION_NAMES[pos]}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

type ScatterDotProps = { cx?: number; cy?: number; payload?: Point }

function ScatterDot({ cx, cy, payload }: ScatterDotProps) {
  if (cx == null || cy == null || !payload) return null
  const color = POSITION_COLORS[payload.positions[0] ?? ""] ?? DEFAULT_COLOR
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={color}
      fillOpacity={0.75}
      stroke={color}
      strokeWidth={1}
      style={{ cursor: "pointer" }}
    />
  )
}

function ScatterTooltip({
  active,
  payload,
  xLabel,
  yLabel,
}: {
  active?: boolean
  payload?: { payload: Point }[]
  xLabel: string
  yLabel: string
}) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload

  return (
    <div className="bg-background grid min-w-40 gap-1 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
      <div className="font-medium">{point.name}</div>
      <div className="text-muted-foreground">{point.team_name}</div>
      <div className="mt-1 grid gap-0.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">{xLabel}</span>
          <span className="font-mono font-medium tabular-nums">{point.x}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">{yLabel}</span>
          <span className="font-mono font-medium tabular-nums">{point.y}</span>
        </div>
      </div>
    </div>
  )
}

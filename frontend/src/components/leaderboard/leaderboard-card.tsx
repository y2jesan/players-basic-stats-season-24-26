import type { ReactNode } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { LeaderboardPlayerBase } from "@/types/football"

const COLLAPSED_COUNT = 5
const EXPANDED_COUNT = 20

export type LeaderboardColumn<T> = {
  key: string
  label: string
  render: (row: T) => ReactNode
}

export function LeaderboardCard<T extends LeaderboardPlayerBase>({
  title,
  data,
  isLoading,
  columns,
}: {
  title: string
  data?: T[]
  isLoading?: boolean
  columns: LeaderboardColumn<T>[]
}) {
  const [expanded, setExpanded] = useState(false)
  const navigate = useNavigate()

  const rows = (data ?? []).slice(0, expanded ? EXPANDED_COUNT : COLLAPSED_COUNT)
  const canExpand = (data?.length ?? 0) > COLLAPSED_COUNT

  return (
    <Card size="sm" className="gap-2">
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-6 px-3">#</TableHead>
              <TableHead>Player</TableHead>
              {columns.map((col) => (
                <TableHead key={col.key} className="px-2 text-right text-xs">
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: COLLAPSED_COUNT }).map((_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  <TableCell colSpan={columns.length + 2} className="px-3">
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length + 2} className="text-muted-foreground px-3 text-center text-xs">
                  No data
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, i) => (
                <TableRow
                  key={row.player_id}
                  className="cursor-pointer"
                  onClick={() => navigate({ to: "/players/$playerId", params: { playerId: row.player_id } })}
                >
                  <TableCell className="text-muted-foreground px-3 text-xs tabular-nums">{i + 1}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm leading-tight font-medium">{row.name}</span>
                      <span className="text-muted-foreground text-xs leading-tight">{row.team_name}</span>
                    </div>
                  </TableCell>
                  {columns.map((col) => (
                    <TableCell key={col.key} className="px-2 text-right text-sm tabular-nums">
                      {col.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      {canExpand && (
        <div className="px-3">
          <Button variant="ghost" size="xs" className="w-full" onClick={() => setExpanded((e) => !e)}>
            {expanded ? "Show top 5" : `Show all ${data?.length}`}
          </Button>
        </div>
      )}
    </Card>
  )
}

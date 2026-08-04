import { createFileRoute } from "@tanstack/react-router"

import { useStatGlossary } from "@/hooks/use-stat-glossary"
import { PageHeader } from "@/components/layout/page-header"
import { Section } from "@/components/layout/section"
import { Skeleton } from "@/components/ui/skeleton"
import type { StatGlossaryEntry } from "@/types/football"

export const Route = createFileRoute("/glossary")({
  component: GlossaryPage,
})

// Mirrors backend/app/analytics/football_common.py's DUP_SUFFIXES/IDENTITY_BASES: the raw
// glossary has one row per CSV column (including source-table duplicates), but this page
// shows one entry per real stat — identity columns (player name, team, nationality, ...)
// aren't analytical stats and are left out.
const DUP_SUFFIXES = ["_stats_keeper", "_stats_shooting", "_stats_playing_time", "_stats_misc"]
const IDENTITY_BASES = new Set(["Rk", "Player", "Nation", "Pos", "Squad", "Comp", "Age", "Born"])

const TYPE_ORDER = ["match", "shooting", "passing", "decipline", "keeping", "defending", "others"]
const TYPE_LABELS: Record<string, string> = {
  match: "Match",
  shooting: "Shooting",
  passing: "Passing",
  decipline: "Discipline",
  keeping: "Keeping",
  defending: "Defending",
  others: "Misc",
}

function canonicalKey(name: string) {
  for (const suffix of DUP_SUFFIXES) {
    if (name.endsWith(suffix)) return name.slice(0, -suffix.length)
  }
  return name
}

function dedupeStats(entries: StatGlossaryEntry[]) {
  const seen = new Map<string, StatGlossaryEntry>()
  for (const entry of entries) {
    const base = canonicalKey(entry.property)
    if (IDENTITY_BASES.has(base)) continue
    const key = `${base}:${entry.type}`
    if (!seen.has(key)) seen.set(key, entry)
  }
  return [...seen.values()]
}

function GlossaryPage() {
  const { entries, isLoading } = useStatGlossary()
  const stats = dedupeStats(entries ?? [])
  const byType = new Map<string, StatGlossaryEntry[]>()
  for (const stat of stats) {
    const group = byType.get(stat.type) ?? []
    group.push(stat)
    byType.set(stat.type, group)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Stat Glossary"
        description="What every stat in this dataset means and how it's calculated."
      />

      {isLoading
        ? Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ))
        : TYPE_ORDER.filter((type) => byType.has(type)).map((type) => (
            <Section key={type} title={TYPE_LABELS[type] ?? type}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {byType
                  .get(type)!
                  .sort((a, b) => a.property.localeCompare(b.property))
                  .map((stat) => (
                    <div key={stat.property} className="rounded-lg border p-4">
                      <div className="flex items-center gap-2">
                        <code className="bg-muted rounded px-1.5 py-0.5 text-xs font-medium">{stat.property}</code>
                        <span className="text-sm font-medium">{stat.short_description}</span>
                      </div>
                      <p className="text-muted-foreground mt-2 text-sm">{stat.long_description}</p>
                    </div>
                  ))}
              </div>
            </Section>
          ))}
    </div>
  )
}

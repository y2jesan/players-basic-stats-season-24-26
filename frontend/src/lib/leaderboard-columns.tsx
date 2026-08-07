import { RectangleVertical } from "lucide-react"

import type { LeaderboardColumn } from "@/components/leaderboard/leaderboard-card"
import type {
  CreativityLeader,
  DefendingLeader,
  DisciplineLeader,
  KeepingLeader,
  LeaderboardCategory,
  PassAccuracyLeader,
  PassingLeader,
  PossessionLeader,
  ProgressionLeader,
  ShootingLeader,
} from "@/types/football"

// Card-level column sets (top-5 preview) shared between the dashboard's "Player
// Leaderboards" section and the /leaderboards index page, so both render the exact
// same LeaderboardCard design for a given category.

export const SHOOTING_COLUMNS: LeaderboardColumn<ShootingLeader>[] = [
  { key: "goals", label: "Gls", statProperty: "Gls", render: (row) => row.goals },
  { key: "goals_assists", label: "G+A", statProperty: "G+A", render: (row) => row.goals_assists },
  { key: "xg", label: "xG", statProperty: "xG", render: (row) => row.xg ?? "-" },
  { key: "xag", label: "xAG", statProperty: "xAG", render: (row) => row.xag ?? "-" },
]

export const PASSING_COLUMNS: LeaderboardColumn<PassingLeader>[] = [
  { key: "assists", label: "Ast", statProperty: "Ast", render: (row) => row.assists },
  { key: "crosses", label: "Crs", statProperty: "Crs", render: (row) => row.crosses ?? "-" },
  { key: "cmp_pct", label: "Cmp%", statProperty: "Cmp%", render: (row) => row.cmp_pct ?? "-" },
  { key: "xa", label: "xA", statProperty: "xA", render: (row) => row.xa ?? "-" },
]

export const DEFENDING_COLUMNS: LeaderboardColumn<DefendingLeader>[] = [
  { key: "tackles_won", label: "TklW", statProperty: "TklW", render: (row) => row.tackles_won ?? 0 },
  { key: "interceptions", label: "Int", statProperty: "Int", render: (row) => row.interceptions ?? 0 },
]

export const DISCIPLINE_COLUMNS: LeaderboardColumn<DisciplineLeader>[] = [
  { key: "fouls_committed", label: "Fls", statProperty: "Fls", render: (row) => row.fouls_committed ?? 0 },
  {
    key: "cards",
    label: "Cards",
    render: (row) => (
      <span className="inline-flex items-center gap-1">
        <RectangleVertical className="size-3 fill-yellow-400 text-yellow-500" />
        {row.yellow_cards ?? 0}
        <RectangleVertical className="size-3 fill-red-500 text-red-600" />
        {row.red_cards ?? 0}
      </span>
    ),
  },
]

export const KEEPING_COLUMNS: LeaderboardColumn<KeepingLeader>[] = [
  { key: "saves", label: "Saves", statProperty: "Saves", render: (row) => row.saves ?? 0 },
  { key: "save_pct", label: "Save%", statProperty: "Save%", render: (row) => row.save_pct ?? "-" },
  { key: "clean_sheet_pct", label: "CS%", statProperty: "CS%", render: (row) => row.clean_sheet_pct ?? "-" },
  { key: "ga90", label: "GA90", statProperty: "GA90", render: (row) => row.ga90 ?? "-" },
]

export const PROGRESSION_COLUMNS: LeaderboardColumn<ProgressionLeader>[] = [
  { key: "prog_passes", label: "PrgP", statProperty: "PrgP", render: (row) => row.prog_passes ?? 0 },
  { key: "prog_carries", label: "PrgC", statProperty: "PrgC", render: (row) => row.prog_carries ?? 0 },
  { key: "prog_received", label: "PrgR", statProperty: "PrgR", render: (row) => row.prog_received ?? 0 },
]

export const PASS_ACCURACY_COLUMNS: LeaderboardColumn<PassAccuracyLeader>[] = [
  { key: "cmp_pct", label: "Cmp%", statProperty: "Cmp%", render: (row) => row.cmp_pct ?? "-" },
  { key: "passes_completed", label: "Cmp", statProperty: "Cmp", render: (row) => row.passes_completed ?? 0 },
  { key: "passes_attempted", label: "Att", statProperty: "Att", render: (row) => row.passes_attempted ?? 0 },
]

export const POSSESSION_COLUMNS: LeaderboardColumn<PossessionLeader>[] = [
  { key: "touches", label: "Touches", statProperty: "Touches", render: (row) => row.touches ?? 0 },
  { key: "carries", label: "Carries", statProperty: "Carries", render: (row) => row.carries ?? 0 },
  { key: "take_on_pct", label: "Succ%", statProperty: "Succ%", render: (row) => row.take_on_pct ?? "-" },
]

export const CREATIVITY_COLUMNS: LeaderboardColumn<CreativityLeader>[] = [
  { key: "sca", label: "SCA", statProperty: "SCA", render: (row) => row.sca ?? 0 },
  { key: "gca", label: "GCA", statProperty: "GCA", render: (row) => row.gca ?? 0 },
  { key: "gca90", label: "GCA/90", statProperty: "GCA90", render: (row) => row.gca90 ?? "-" },
]

export const LEADERBOARD_CATEGORIES: { category: LeaderboardCategory; title: string; columns: LeaderboardColumn<any>[] }[] = [
  { category: "shooting", title: "Shooting", columns: SHOOTING_COLUMNS },
  { category: "passing", title: "Passing", columns: PASSING_COLUMNS },
  { category: "defending", title: "Defending", columns: DEFENDING_COLUMNS },
  { category: "discipline", title: "Discipline", columns: DISCIPLINE_COLUMNS },
  { category: "keeping", title: "Keeping", columns: KEEPING_COLUMNS },
  { category: "progression", title: "Progression", columns: PROGRESSION_COLUMNS },
  { category: "pass_accuracy", title: "Pass Accuracy", columns: PASS_ACCURACY_COLUMNS },
  { category: "possession", title: "Possession", columns: POSSESSION_COLUMNS },
  { category: "creativity", title: "Creativity", columns: CREATIVITY_COLUMNS },
]

// Shapes returned by the real-dataset /api/football/* endpoints (backend/app/api/routes/football.py).

export type CodeName = {
  code: string
  name: string
}

export type Season = {
  id: string
  label: string
  is_default: boolean
}

export type Competition = {
  competition_id: string
  name: string
  country_code: string
  team_count: number
  player_count: number
}

export type Country = {
  code: string
  name: string
  player_count: number
  total_goals: number
  total_assists: number
  avg_age: number
  total_yellow_cards: number
  total_red_cards: number
}

export type DashboardSummary = {
  total_competitions: number
  total_teams: number
  total_players: number
  total_countries: number
  total_goals: number
  total_assists: number
}

export type TeamSummary = {
  team_id: string
  name: string
  competition: string
  competition_name: string
  country: string
  player_count: number
  total_goals: number
  total_assists: number
  avg_age: number
  total_yellow_cards: number
  total_red_cards: number
}

export type TeamRosterPlayer = {
  player_id: string
  name: string
  positions: string[]
  nationality: CodeName | null
  age: number | null
  appearances: number | null
  goals: number | null
  assists: number | null
  yellow_cards: number | null
  red_cards: number | null
}

export type TeamDetail = {
  team: {
    team_id: string
    name: string
    competition: CodeName | null
    player_count: number
    season: string
  }
  players: TeamRosterPlayer[]
}

export type CountryRosterPlayer = {
  player_id: string
  name: string
  positions: string[]
  team_id: string
  team_name: string
  competition: CodeName | null
  age: number | null
  appearances: number | null
  goals: number | null
  assists: number | null
  yellow_cards: number | null
  red_cards: number | null
}

export type CountryDetail = {
  country: {
    code: string
    name: string
    player_count: number
    season: string
  }
  players: CountryRosterPlayer[]
}

export type LeaderboardPlayerBase = {
  player_id: string
  name: string
  team_id: string
  team_name: string
  positions: string[]
  competition: CodeName | null
  minutes: number
  matches_played: number
}

export type StatGlossaryEntry = {
  property: string
  type: string
  short_description: string
  long_description: string
}

export type ShootingLeader = LeaderboardPlayerBase & {
  goals: number
  goals_assists: number
  shots: number | null
  shots_on_target: number | null
  shots_on_target_pct: number | null
  xg: number | null
  npxg: number | null
  xag: number | null
}

export type PassingLeader = LeaderboardPlayerBase & {
  assists: number
  crosses: number | null
  cmp_pct: number | null
  key_passes: number | null
  xa: number | null
}

export type MatchLeader = LeaderboardPlayerBase & {
  starts: number | null
  nineties: number | null
}

export type DefendingLeader = LeaderboardPlayerBase & {
  tackles_won: number | null
  interceptions: number | null
  clean_sheets: number | null
  clean_sheet_pct: number | null
  tkl_pct: number | null
  clearances: number | null
}

export type DisciplineLeader = LeaderboardPlayerBase & {
  fouls_committed: number | null
  fouls_drawn: number | null
  yellow_cards: number | null
  red_cards: number | null
  second_yellow_cards: number | null
}

export type Leaderboards = {
  shooting: ShootingLeader[]
  passing: PassingLeader[]
  match: MatchLeader[]
  defending: DefendingLeader[]
  discipline: DisciplineLeader[]
}

export type LeaderboardCategory = keyof Leaderboards

export type PlayerProfile = {
  player_id: string
  name: string
  nation: CodeName | null
  positions: string[]
  age: number | null
  born: number | null
  team_id: string
  team_name: string
  competition: CodeName | null
  season: string
}

export type StatEntry = {
  key: string
  label: string
  type: string
  value: string | number
  advanced: boolean
  league_percentile: number | null
  overall_percentile: number | null
}

export type StatCardGroup = {
  type: string
  label: string
  stats: StatEntry[]
}

export type RadarAxis = {
  key: string
  label: string
  value: number | string | null
  percentile: number | null
}

export type RadarChartData = {
  position: string
  sample_size: number
  axes: RadarAxis[]
}

export type PlayerDetail = {
  profile: PlayerProfile
  cards: StatCardGroup[]
  radar_charts: RadarChartData[]
}

export type PlayerSearchResult = {
  player_id: string
  name: string
  team_id: string
  team_name: string
  positions: string[]
}

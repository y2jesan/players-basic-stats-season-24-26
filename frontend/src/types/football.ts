// Shapes returned by the real-dataset /api/football/* endpoints (backend/app/api/routes/football.py).

export type CodeName = {
  code: string
  name: string
}

export type Season = {
  id: string
  label: string
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
  }
  players: CountryRosterPlayer[]
}

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
}

export type StatCardGroup = {
  type: string
  label: string
  stats: StatEntry[]
}

export type PlayerDetail = {
  profile: PlayerProfile
  cards: StatCardGroup[]
}

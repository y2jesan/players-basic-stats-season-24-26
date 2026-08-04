// Mirrors ADVANCED_STAT_KEYS in backend/app/analytics/football_common.py, trimmed to
// the columns leaderboards actually expose (the full backend set also covers
// keeping/misc-only advanced stats that never reach a leaderboard column).
export const ADVANCED_STAT_KEYS = new Set(["xG", "npxG", "xAG", "xA", "GCA", "SCA", "PSxG"])

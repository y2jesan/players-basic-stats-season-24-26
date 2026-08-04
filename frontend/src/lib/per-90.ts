// Stats already expressed as a rate/average — dividing them by minutes again would be wrong.
const NEVER_PER_90 = new Set([
  "MP",
  "Min",
  "Starts",
  "90s",
  "Age",
  "Born",
  "PPM",
  "On-Off",
  "Compl",
  "Subs",
  "unSub",
  "Dist", // "Average Shot Distance" — already an average, despite the bare key
])

export function isRateStat(key: string): boolean {
  if (NEVER_PER_90.has(key)) return true
  if (key.includes("%")) return true
  if (key.includes("/90") || /90$/.test(key)) return true
  if (key.startsWith("Mn/")) return true
  if (key.includes("/Sh") || key.includes("/SoT")) return true
  if (key.startsWith("Avg")) return true
  return false
}

// null when minutes is missing/zero — caller falls back to showing "-" or the raw value.
export function toPer90(value: number, minutes: number | null | undefined): number | null {
  if (!minutes) return null
  return Math.round((value / (minutes / 90)) * 100) / 100
}

const RED = [239, 68, 68] // tailwind red-500
const WHITE = [255, 255, 255]
const GREEN = [34, 197, 94] // tailwind green-500

// Deliberately theme-independent (same pastel-toned red->white->green scale in light
// and dark mode, mirroring FBref's percentile rings) — endpoints are medium-brightness
// tones rather than fully saturated, so a fixed dark text color stays legible across
// the whole range without needing per-theme branching.
export function percentileColor(percentile: number): string {
  const t = percentile <= 50 ? percentile / 50 : (percentile - 50) / 50
  const [from, to] = percentile <= 50 ? [RED, WHITE] : [WHITE, GREEN]
  const [r, g, b] = from.map((c, i) => Math.round(c + (to[i] - c) * t))
  return `rgb(${r}, ${g}, ${b})`
}

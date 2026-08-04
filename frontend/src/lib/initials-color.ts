import type { CSSProperties } from "react"

// Deterministic hue from a name, used for initials tiles standing in for crests/photos.
export function hashHue(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) % 360
}

export function initialsTileStyle(input: string): CSSProperties {
  return { backgroundColor: `oklch(0.55 0.13 ${hashHue(input)})` }
}

export function getInitials(name: string, max = 2): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, max)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

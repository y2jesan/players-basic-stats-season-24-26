import { useEffect, useState } from "react"

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
})

// Ticks every second using the browser's own resolved timezone (no geo-IP, no network calls).
export function useClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return {
    formatted: timeFormatter.format(now),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }
}

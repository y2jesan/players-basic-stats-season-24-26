import { useEffect, useState } from "react"

// Persists a piece of state to localStorage under `key`, debounced by the effect's own batching.
// Falls back to `initialValue` when `key` is undefined (persistence disabled) or nothing is stored yet.
export function useLocalStorageState<T>(key: string | undefined, initialValue: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    if (!key) return initialValue
    try {
      const stored = localStorage.getItem(key)
      return stored ? (JSON.parse(stored) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    if (!key) return
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}

import type { Updater } from "@tanstack/react-table"
import { useCallback, useState } from "react"

// Falls back to internal state when the caller doesn't pass a controlled value + change handler
// (used to make DataTable's sorting/filters/pagination optionally URL- or fetch-controlled).
export function useControllableState<T>(
  controlledValue: T | undefined,
  onControlledChange: ((updater: Updater<T>) => void) | undefined,
  initialValue: T
): [T, (updater: Updater<T>) => void] {
  const [internalValue, setInternalValue] = useState<T>(initialValue)
  const value = controlledValue ?? internalValue

  const setValue = useCallback(
    (updater: Updater<T>) => {
      if (onControlledChange) {
        onControlledChange(updater)
      } else {
        setInternalValue((old) => (typeof updater === "function" ? (updater as (old: T) => T)(old) : updater))
      }
    },
    [onControlledChange]
  )

  return [value, setValue]
}

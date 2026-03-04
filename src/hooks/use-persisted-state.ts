'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Drop-in useState replacement that persists to localStorage.
 * Reads from localStorage on mount (via useEffect to avoid SSR mismatch)
 * and writes on every update.
 */
export function usePersistedState<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(defaultValue)

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key)
      if (saved !== null) {
        const parsed = JSON.parse(saved) as T
        setState(parsed)
      }
    } catch {
      // ignore bad data
    }
  }, [key])

  // Persist-on-update wrapper
  const setPersistedState = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setState(prev => {
        const next = typeof updater === 'function' ? (updater as (prev: T) => T)(prev) : updater
        try {
          localStorage.setItem(key, JSON.stringify(next))
        } catch {
          // quota exceeded — ignore
        }
        return next
      })
    },
    [key]
  )

  return [state, setPersistedState]
}
